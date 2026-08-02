#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const version = process.argv[2] || packageJson.version
const tag = `v${version}`
const packageSpec = `${packageJson.name}@${version}`

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  throw new Error('Usage: node scripts/verify-release.mjs <stable-version>')
}

function run(command, args, options = {}) {
  const usesWindowsShim = process.platform === 'win32' && ['npm', 'npx'].includes(command)
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: options.capture === false ? 'inherit' : 'pipe',
    shell: usesWindowsShim
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n` +
      (result.error?.message || result.stderr || result.stdout || 'no process output'))
  }
  return (result.stdout || '').trim()
}

function readJson(command, args, options) {
  return JSON.parse(run(command, args, options))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function filesUnder(directory, base = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(target, base) : [path.relative(base, target)]
  }).sort()
}

function normalizedFile(file) {
  const content = fs.readFileSync(file)
  return content.includes(0) ? content : Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n'))
}

function checkLocalRelease() {
  assert(packageJson.version === version, `package.json is ${packageJson.version}, expected ${version}`)
  for (const file of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
    assert(manifest.version === version, `${file} is ${manifest.version}, expected ${version}`)
  }
  const changelog = fs.readFileSync(path.join(root, 'docs-site/changelog.md'), 'utf8')
  assert(changelog.includes(`## ${version} —`), `changelog is missing its ${version} heading`)
  assert(run('git', ['status', '--porcelain']) === '', 'worktree must be clean for release verification')
}

function checkGitHubRelease() {
  run('git', ['fetch', 'origin', 'main', '--tags'])
  const mainCommit = run('git', ['rev-parse', 'origin/main'])
  const tagCommit = run('git', ['rev-list', '-n', '1', tag])
  run('git', ['merge-base', '--is-ancestor', tagCommit, mainCommit])

  const release = readJson('gh', [
    'release', 'view', tag, '--json', 'isDraft,isPrerelease,tagName,url'
  ])
  assert(release.tagName === tag && !release.isDraft && !release.isPrerelease,
    `${tag} must have a published stable GitHub Release`)

  const runs = readJson('gh', [
    'run', 'list', '--branch', 'main', '--limit', '30',
    '--json', 'workflowName,status,conclusion,headSha,url'
  ])
  for (const workflow of ['Validate', 'Docs']) {
    const match = runs.find((item) => item.workflowName === workflow && item.headSha === mainCommit)
    assert(match?.status === 'completed' && match?.conclusion === 'success',
      `${workflow} must succeed on current origin/main ${mainCommit}`)
  }
  return { mainCommit, tagCommit, releaseUrl: release.url }
}

function checkNpmPackage() {
  const published = readJson('npm', [
    'view', packageSpec, 'version', 'dist.integrity', 'dist-tags.latest', '--json'
  ])
  assert(published.version === version, `${packageSpec} is not published`)
  assert(published['dist-tags.latest'] === version, `npm latest is ${published['dist-tags.latest']}, expected ${version}`)

  assert(typeof published['dist.integrity'] === 'string' && published['dist.integrity'].startsWith('sha512-'),
    'published npm package is missing registry integrity metadata')

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-release-source-'))
  const releaseRoot = path.join(temporaryRoot, 'release')
  const localPackRoot = path.join(temporaryRoot, 'local-pack')
  const publicPackRoot = path.join(temporaryRoot, 'public-pack')
  const localExtractRoot = path.join(temporaryRoot, 'local-extract')
  const publicExtractRoot = path.join(temporaryRoot, 'public-extract')
  for (const directory of [localPackRoot, publicPackRoot, localExtractRoot, publicExtractRoot]) {
    fs.mkdirSync(directory, { recursive: true })
  }
  try {
    run('git', ['-c', 'core.autocrlf=false', 'worktree', 'add', '--detach', releaseRoot, tag])
    const localName = run('npm', ['pack', '--silent', '--pack-destination', localPackRoot], { cwd: releaseRoot })
    const publicName = run('npm', [
      'pack', '--silent', packageSpec, '--pack-destination', publicPackRoot
    ])
    run('tar', ['-xf', path.join(localPackRoot, localName), '-C', localExtractRoot])
    run('tar', ['-xf', path.join(publicPackRoot, publicName), '-C', publicExtractRoot])

    const localPackageRoot = path.join(localExtractRoot, 'package')
    const publicPackageRoot = path.join(publicExtractRoot, 'package')
    const localFiles = filesUnder(localPackageRoot)
    const publicFiles = filesUnder(publicPackageRoot)
    assert(JSON.stringify(localFiles) === JSON.stringify(publicFiles),
      `published npm file list does not match ${tag}`)
    for (const file of localFiles) {
      assert(normalizedFile(path.join(localPackageRoot, file))
        .equals(normalizedFile(path.join(publicPackageRoot, file))),
      `published npm content differs from ${tag}: ${file}`)
    }
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', releaseRoot], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe'
    })
    fs.rmSync(temporaryRoot, { recursive: true, force: true })
  }
  return published['dist.integrity']
}

async function checkLiveDocs() {
  const pages = [
    ['https://sockulags.github.io/agent-os/guide/getting-started.html',
      'Codex and Claude Code do not need to be installed'],
    ['https://sockulags.github.io/agent-os/changelog.html', version]
  ]
  for (const [url, expected] of pages) {
    const response = await fetch(url)
    const body = await response.text()
    assert(response.ok && body.includes(expected), `${url} is not live with expected release content`)
  }
}

function checkPublicInstall() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-release-'))
  const home = path.join(temporaryRoot, 'home')
  const cwd = path.join(temporaryRoot, 'run')
  fs.mkdirSync(home, { recursive: true })
  fs.mkdirSync(cwd, { recursive: true })
  try {
    run('npx', [
      '--yes', packageSpec, 'install', '--platform', 'both', '--scope', 'user', '--no-policy', '--yes'
    ], {
      cwd,
      env: { ...process.env, HOME: home, USERPROFILE: home },
      capture: false
    })
    for (const platformRoot of ['.claude', '.codex']) {
      const skillsRoot = path.join(home, platformRoot, 'skills')
      const manifest = JSON.parse(fs.readFileSync(path.join(skillsRoot, '.agent-os-install.json'), 'utf8'))
      const installed = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
      assert(manifest.version === version && installed.length === manifest.skills.length,
        `${platformRoot} public install is incomplete`)
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true })
  }
}

checkLocalRelease()
const github = checkGitHubRelease()
const integrity = checkNpmPackage()
await checkLiveDocs()
checkPublicInstall()

console.log(`Release ${version} verified.`)
console.log(`main=${github.mainCommit}`)
console.log(`tag=${github.tagCommit}`)
console.log(`npm_integrity=${integrity}`)
console.log(`release=${github.releaseUrl}`)
