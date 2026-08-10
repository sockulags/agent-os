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

function run(command, args, options = {}) {
  const usesWindowsShim = process.platform === 'win32' && command === 'npm'
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

function verifyInstall() {
  for (const platformRoot of ['.claude', '.codex']) {
    const skillsRoot = path.join(home, platformRoot, 'skills')
    const unrelatedFile = path.join(skillsRoot, 'unrelated', 'SKILL.md')
    const manifest = JSON.parse(fs.readFileSync(path.join(skillsRoot, '.agent-os-install.json'), 'utf8'))
    if (manifest.version !== packageJson.version || !fs.existsSync(unrelatedFile)) {
      throw new Error(`${platformRoot} packed install is incomplete or overwrote an unrelated skill`)
    }
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

  console.log(`Packed ${packageJson.name}@${packageJson.version} install and update smoke test passed.`)
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}
