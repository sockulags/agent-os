#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-pack-smoke-'))
const home = path.join(temporaryRoot, 'home')
const runRoot = path.join(temporaryRoot, 'run')
const packRoot = path.join(temporaryRoot, 'pack')
const packageInstallRoot = path.join(temporaryRoot, 'package-install')

function runResult(command, args, options = {}) {
  const usesWindowsShim = process.platform === 'win32' && command === 'npm'
  return spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    encoding: 'utf8',
    input: options.input,
    stdio: options.capture === false ? 'inherit' : 'pipe',
    shell: usesWindowsShim
  })
}

function run(command, args, options = {}) {
  const result = runResult(command, args, options)
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n` +
      (result.error?.message || result.stderr || result.stdout || 'no process output'))
  }
  return (result.stdout || '').trim()
}

function verifyInstall() {
  for (const platformRoot of ['.claude', '.codex']) {
    const skillsRoot = path.join(home, platformRoot, 'skills')
    const unrelatedFile = path.join(skillsRoot, 'unrelated', 'SKILL.md')
    const manifest = JSON.parse(fs.readFileSync(path.join(skillsRoot, '.agent-os-install.json'), 'utf8'))
    const hookFile = path.join(home, platformRoot, platformRoot === '.claude' ? 'settings.json' : 'hooks.json')
    const hookConfig = JSON.parse(fs.readFileSync(hookFile, 'utf8'))
    const managedHooks = hookConfig.hooks?.Stop?.filter((group) =>
      JSON.stringify(group).includes('--agent-os-hook=quality-ratchet')) || []
    const runner = path.join(skillsRoot, 'quality-ratchet', 'scripts', 'quality-delta.mjs')
    const managedCommand = managedHooks[0]?.hooks?.[0]?.command || ''
    if (manifest.version !== packageJson.version || manifest.schemaVersion !== 2 ||
        !manifest.integrations?.hooks || !fs.existsSync(unrelatedFile) || !fs.existsSync(runner) ||
        managedHooks.length !== 1 || !managedCommand.includes(runner)) {
      throw new Error(`${platformRoot} packed install is incomplete or overwrote an unrelated skill`)
    }
  }
}

function verifyInstalledLifecycle() {
  const repository = path.join(runRoot, 'quality-repository')
  fs.mkdirSync(repository, { recursive: true })
  run('git', ['init', '-q'], { cwd: repository })
  fs.writeFileSync(path.join(repository, 'entry.js'), 'export const entry = true\n')

  for (const platformRoot of ['.claude', '.codex']) {
    const runner = path.join(home, platformRoot, 'skills', 'quality-ratchet', 'scripts', 'quality-delta.mjs')
    run(process.execPath, [runner, 'begin'], { cwd: repository })

    const active = runResult(process.execPath, [runner, 'hook'], {
      cwd: repository,
      input: JSON.stringify({ cwd: repository, stop_hook_active: false })
    })
    const activeOutput = JSON.parse(active.stdout || '{}')
    if (active.status !== 2 || activeOutput.decision !== 'block' || !activeOutput.reason?.includes(runner)) {
      throw new Error(`${platformRoot} installed runner did not activate its Stop lifecycle.`)
    }

    fs.writeFileSync(path.join(repository, `${platformRoot.slice(1)}-candidate.js`), 'export const candidate = true\n')
    run(process.execPath, [runner, 'check'], { cwd: repository })
    const fresh = runResult(process.execPath, [runner, 'hook'], {
      cwd: repository,
      input: JSON.stringify({ cwd: repository, stop_hook_active: false })
    })
    if (fresh.status !== 0 || JSON.stringify(JSON.parse(fresh.stdout || '{}')) !== '{}') {
      throw new Error(`${platformRoot} installed runner did not accept and clear a fresh check.`)
    }

    run(process.execPath, [runner, 'begin'], { cwd: repository })
    run(process.execPath, [runner, 'clear'], { cwd: repository })
  }
}

fs.mkdirSync(packRoot, { recursive: true })
fs.mkdirSync(runRoot, { recursive: true })
for (const platformRoot of ['.claude', '.codex']) {
  const unrelatedRoot = path.join(home, platformRoot, 'skills', 'unrelated')
  fs.mkdirSync(unrelatedRoot, { recursive: true })
  fs.writeFileSync(path.join(unrelatedRoot, 'SKILL.md'), '# Unrelated\n')
}

try {
  const tarballName = run('npm', ['pack', '--silent', '--pack-destination', packRoot])
  const tarball = path.join(packRoot, tarballName)
  const isolatedEnvironment = { ...process.env, HOME: home, USERPROFILE: home }
  run('npm', [
    'install', '--prefix', packageInstallRoot, '--ignore-scripts', '--no-audit', '--no-fund', tarball
  ])
  const packedCli = path.join(
    packageInstallRoot, 'node_modules', '@sockulags', 'agent-os', 'cli', 'index.mjs'
  )
  const packedRoot = path.dirname(path.dirname(packedCli))
  if (!fs.existsSync(path.join(packedRoot, 'hooks', 'hooks.json')) ||
      !fs.existsSync(path.join(packedRoot, 'skills', 'quality-ratchet', 'scripts', 'quality-delta.mjs'))) {
    throw new Error('Packed artifact omitted the native hook or quality-ratchet runner.')
  }

  for (const command of ['install', 'update']) {
    run(process.execPath, [
      packedCli, command, '--platform', 'both', '--scope', 'user', '--no-policy', '--yes'
    ], {
      cwd: runRoot,
      env: isolatedEnvironment,
      capture: false
    })
    verifyInstall()
  }

  verifyInstalledLifecycle()

  console.log(`Packed ${packageJson.name}@${packageJson.version} install and update smoke test passed.`)
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}
