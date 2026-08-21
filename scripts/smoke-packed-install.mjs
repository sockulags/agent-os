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
    shell: usesWindowsShim,
    windowsVerbatimArguments: options.windowsVerbatimArguments
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
    if (active.status !== 0 || activeOutput.decision !== 'block' || !activeOutput.reason?.includes(runner)) {
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

  return repository
}

function verifyStopLifecycle(label, runner, repository, environment, runStop) {
  run(process.execPath, [runner, 'begin'], { cwd: repository, env: environment })

  const first = runStop(false)
  const firstOutput = JSON.parse(first.stdout || '{}')
  if (first.status !== 0 || firstOutput.decision !== 'block') {
    throw new Error(`${label} did not block an unchecked baseline.`)
  }
  const reentered = runStop(true)
  const reenteredOutput = JSON.parse(reentered.stdout || '{}')
  if (reentered.status !== 0 || reenteredOutput.decision !== 'block') {
    throw new Error(`${label} bypassed an unchecked re-entry.`)
  }

  run(process.execPath, [runner, 'check'], { cwd: repository, env: environment })
  const fresh = runStop(false)
  if (fresh.status !== 0 || JSON.stringify(JSON.parse(fresh.stdout || '{}')) !== '{}') {
    throw new Error(`${label} did not accept and clear a fresh check.`)
  }
}

function verifyNativeCodexWindowsHook(packedRoot, repository) {
  const hooks = JSON.parse(fs.readFileSync(path.join(packedRoot, 'hooks', 'hooks.json'), 'utf8'))
  const nativeHook = hooks.hooks?.Stop?.flatMap((group) => group.hooks || [])
    .find((entry) => entry.type === 'command' && entry.command?.includes('--agent-os-hook=quality-ratchet'))
  const windowsMatch = typeof nativeHook?.commandWindows === 'string'
    ? /^powershell\.exe -NoProfile -NonInteractive -EncodedCommand ([A-Za-z0-9+/]+={0,2})$/.exec(
        nativeHook.commandWindows
      )
    : null
  const decodedWindowsCommand = windowsMatch
    ? Buffer.from(windowsMatch[1], 'base64').toString('utf16le')
    : null
  const expectedWindowsCommand =
    "$runner = Join-Path $env:PLUGIN_ROOT 'skills\\quality-ratchet\\scripts\\quality-delta.mjs'; " +
    'node $runner hook --agent-os-hook=quality-ratchet'
  if (!nativeHook?.command?.includes('${CLAUDE_PLUGIN_ROOT}') ||
      nativeHook.commandWindows?.includes('"') || decodedWindowsCommand !== expectedWindowsCommand) {
    throw new Error('Packed native hook is missing its Unix or Windows plugin-root command.')
  }
  if (process.platform !== 'win32') return

  const runner = path.join(packedRoot, 'skills', 'quality-ratchet', 'scripts', 'quality-delta.mjs')
  const baseEnvironment = {
    ...process.env,
    PLUGIN_ROOT: packedRoot,
    CLAUDE_PLUGIN_ROOT: packedRoot
  }
  delete baseEnvironment.CODEX_THREAD_ID
  delete baseEnvironment.CLAUDE_CODE_SESSION_ID

  const cmdSessionId = 'codex-packed-native-cmd-smoke'
  const cmdEnvironment = { ...baseEnvironment, CODEX_THREAD_ID: cmdSessionId }
  const codexCommandArgument = `"${nativeHook.commandWindows}"`
  const runCmdStop = (stopHookActive) => runResult('cmd.exe', ['/c', codexCommandArgument], {
    cwd: repository,
    env: baseEnvironment,
    windowsVerbatimArguments: true,
    input: JSON.stringify({
      cwd: repository,
      session_id: cmdSessionId,
      turn_id: 'codex-packed-native-cmd-turn',
      stop_hook_active: stopHookActive
    })
  })
  verifyStopLifecycle('Codex cmd.exe native Windows Stop hook', runner, repository, cmdEnvironment, runCmdStop)

  const powershellSessionId = 'codex-packed-native-powershell-smoke'
  const powershellEnvironment = {
    ...baseEnvironment,
    CODEX_THREAD_ID: powershellSessionId
  }
  const runPowerShellStop = (stopHookActive) => runResult('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command', nativeHook.commandWindows
  ], {
    cwd: repository,
    env: baseEnvironment,
    input: JSON.stringify({
      cwd: repository,
      session_id: powershellSessionId,
      turn_id: 'codex-packed-native-powershell-turn',
      stop_hook_active: stopHookActive
    })
  })
  verifyStopLifecycle(
    'Codex PowerShell native Windows Stop hook',
    runner,
    repository,
    powershellEnvironment,
    runPowerShellStop
  )
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
  const spacedPluginRoot = path.join(temporaryRoot, 'packed plugin & root^')
  fs.cpSync(packedRoot, spacedPluginRoot, { recursive: true })

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

  const lifecycleRepository = verifyInstalledLifecycle()
  verifyNativeCodexWindowsHook(spacedPluginRoot, lifecycleRepository)

  console.log(`Packed ${packageJson.name}@${packageJson.version} install and update smoke test passed.`)
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}
