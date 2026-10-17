import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  buildManagedHookCommand,
  buildPlan,
  CODEX_HOOK_TRUST_NOTICE,
  executeInstall,
  hookConfigPath,
  INSTALL_MANIFEST,
  PACKAGE_NAME,
  parseArgs,
  planManagedHookConfig,
  planPolicyUpdate,
  policyBlockVersion,
  resolveOptions,
  run,
  targetSkillRoot,
  VERSION
} from './index.mjs'
import { compareVersions, latestPublishedVersion } from './doctor.mjs'
import { resolvePolicyVersion } from '../skills/init-agent-os/scripts/policy-block.mjs'

const temporaryRoots = []

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-cli-'))
  temporaryRoots.push(root)
  return root
}

function silentOutput() {
  return { write() {} }
}

function packageRootForTest() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
}

after(() => {
  for (const root of temporaryRoots) fs.rmSync(root, { recursive: true, force: true })
})

test('defaults to guided direct install', () => {
  assert.deepEqual(parseArgs([]), {
    command: 'install',
    platform: null,
    method: null,
    scope: null,
    policy: null,
    yes: false,
    dryRun: false,
    help: false,
    version: false,
    offline: false
  })
})

test('parses non-interactive direct update flags', () => {
  assert.deepEqual(parseArgs([
    'update',
    '--platform=both',
    '--method',
    'direct',
    '--scope',
    'project',
    '--no-policy',
    '--yes'
  ]), {
    command: 'update',
    platform: 'both',
    method: 'direct',
    scope: 'project',
    policy: false,
    yes: true,
    dryRun: false,
    help: false,
    version: false,
    offline: false
  })
})

test('supports Claude Code as a platform alias and upgrade as update', () => {
  assert.deepEqual(parseArgs(['upgrade', '--platform', 'claude-code', '--yes']), {
    command: 'update',
    platform: 'claude',
    method: null,
    scope: null,
    policy: null,
    yes: true,
    dryRun: false,
    help: false,
    version: false,
    offline: false
  })
})

test('prints scoped npm commands and explains the direct default', async () => {
  const chunks = []
  await run(['--help'], { output: { write: (chunk) => chunks.push(chunk) } })
  const help = chunks.join('')
  assert.match(help, /npx @sockulags\/agent-os install/)
  assert.match(help, /does not require Codex or Claude Code CLI/)
  assert.match(help, /--method <name>\s+direct \(default\) or plugin/)
})

test('rejects conflicting policy flags and direct local scope', async () => {
  assert.throws(() => parseArgs(['install', '--policy', '--no-policy']), /one of --policy and --no-policy/)
  await assert.rejects(
    resolveOptions(parseArgs([
      'install', '--platform', 'codex', '--method', 'direct', '--scope', 'local', '--yes'
    ]), { input: { isTTY: false }, output: { isTTY: false } }),
    /Local scope is available only with --method plugin/
  )
})

test('requires explicit non-interactive choices', async () => {
  await assert.rejects(
    resolveOptions(parseArgs(['install']), {
      input: { isTTY: false },
      output: { isTTY: false }
    }),
    /--yes with explicit options/
  )
})

test('builds direct filesystem plans without marketplace commands', () => {
  const root = temporaryRoot()
  const plan = buildPlan({
    command: 'install',
    platform: 'both',
    method: 'direct',
    scope: 'user',
    policy: false
  }, { homeDir: root, cwd: root })
  assert.deepEqual(plan.map((step) => step.kind), ['install-skills', 'install-hooks', 'install-skills', 'install-hooks'])
  assert.deepEqual(plan.map((step) => step.command), ['filesystem', 'filesystem', 'filesystem', 'filesystem'])
  assert.equal(plan[0].args[0], path.join(root, '.claude', 'skills'))
  assert.equal(plan[1].args[0], path.join(root, '.claude', 'settings.json'))
  assert.equal(plan[2].args[0], path.join(root, '.codex', 'skills'))
  assert.equal(plan[3].args[0], path.join(root, '.codex', 'hooks.json'))
})

test('maps project and user targets for both hosts', () => {
  const root = temporaryRoot()
  const project = path.join(root, 'project')
  assert.equal(targetSkillRoot('codex', 'user', { homeDir: root, cwd: project }), path.join(root, '.codex', 'skills'))
  assert.equal(targetSkillRoot('claude', 'user', { homeDir: root, cwd: project }), path.join(root, '.claude', 'skills'))
  assert.equal(targetSkillRoot('codex', 'project', { homeDir: root, cwd: project }), path.join(project, '.agents', 'skills'))
  assert.equal(targetSkillRoot('claude', 'project', { homeDir: root, cwd: project }), path.join(project, '.claude', 'skills'))
})

test('installs both hosts and policy without either host CLI', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const cwd = path.join(root, 'project')
  await executeInstall({
    command: 'install',
    platform: 'both',
    method: 'direct',
    scope: 'user',
    policy: true
  }, {
    output: silentOutput(),
    homeDir,
    cwd,
    exists: () => { throw new Error('host CLI lookup must not run') },
    execute: () => { throw new Error('external command must not run') }
  })

  for (const agent of ['.claude', '.codex']) {
    const skillsRoot = path.join(homeDir, agent, 'skills')
    assert.equal(fs.existsSync(path.join(skillsRoot, 'shape-work', 'SKILL.md')), true)
    const manifest = JSON.parse(fs.readFileSync(path.join(skillsRoot, INSTALL_MANIFEST), 'utf8'))
    assert.equal(manifest.package, PACKAGE_NAME)
    assert.equal(manifest.version, VERSION)
    assert.equal(manifest.schemaVersion, 2)
    assert.ok(manifest.skills.includes('shape-work'))
    assert.equal(manifest.integrations.hooks.event, 'Stop')
    const hookFile = path.join(homeDir, agent, agent === '.claude' ? 'settings.json' : 'hooks.json')
    assert.equal(fs.existsSync(hookFile), true)
    const hookConfig = JSON.parse(fs.readFileSync(hookFile, 'utf8'))
    const command = hookConfig.hooks.Stop.find((group) =>
      JSON.stringify(group).includes('--agent-os-hook=quality-ratchet')).hooks[0].command
    assert.equal(command.includes(path.join(skillsRoot, 'quality-ratchet', 'scripts', 'quality-delta.mjs')), true)
    assert.equal(command.includes(packageRootForTest()), false)
  }
  assert.match(fs.readFileSync(path.join(homeDir, '.claude', 'CLAUDE.md'), 'utf8'), /BEGIN AGENT OS/)
  assert.match(fs.readFileSync(path.join(homeDir, '.codex', 'AGENTS.md'), 'utf8'), /BEGIN AGENT OS/)
})

test('maps direct hook configuration paths for user and project scopes', () => {
  const root = temporaryRoot()
  const project = path.join(root, 'project')
  assert.equal(hookConfigPath('claude', 'user', { homeDir: root, cwd: project }), path.join(root, '.claude', 'settings.json'))
  assert.equal(hookConfigPath('codex', 'user', { homeDir: root, cwd: project }), path.join(root, '.codex', 'hooks.json'))
  assert.equal(hookConfigPath('claude', 'project', { homeDir: root, cwd: project }), path.join(project, '.claude', 'settings.json'))
  assert.equal(hookConfigPath('codex', 'project', { homeDir: root, cwd: project }), path.join(project, '.codex', 'hooks.json'))
})

test('direct project install configures both hosts without replacing unrelated hooks', async () => {
  const root = temporaryRoot()
  const project = path.join(root, 'project')
  const claudeConfig = path.join(project, '.claude', 'settings.json')
  const codexConfig = path.join(project, '.codex', 'hooks.json')
  fs.mkdirSync(path.dirname(claudeConfig), { recursive: true })
  fs.mkdirSync(path.dirname(codexConfig), { recursive: true })
  const unrelated = {
    permissions: { allow: ['Read'] },
    hooks: {
      PreToolUse: [{ hooks: [{ type: 'command', command: 'developer-preflight' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'developer-stop' }] }]
    }
  }
  fs.writeFileSync(claudeConfig, JSON.stringify(unrelated, null, 2) + '\n')
  fs.writeFileSync(codexConfig, JSON.stringify(unrelated, null, 2) + '\n')
  await executeInstall({
    command: 'install', platform: 'both', method: 'direct', scope: 'project', policy: false
  }, { output: silentOutput(), homeDir: root, cwd: project })

  for (const [file, skillsRoot] of [
    [claudeConfig, path.join(project, '.claude', 'skills')],
    [codexConfig, path.join(project, '.agents', 'skills')]
  ]) {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.deepEqual(config.permissions, unrelated.permissions)
    assert.deepEqual(config.hooks.PreToolUse, unrelated.hooks.PreToolUse)
    assert.deepEqual(config.hooks.Stop[0], unrelated.hooks.Stop[0])
    assert.equal(config.hooks.Stop.filter((group) => JSON.stringify(group).includes('--agent-os-hook=quality-ratchet')).length, 1)
    const command = config.hooks.Stop.find((group) =>
      JSON.stringify(group).includes('--agent-os-hook=quality-ratchet')).hooks[0].command
    assert.equal(command.includes(path.join(skillsRoot, 'quality-ratchet', 'scripts', 'quality-delta.mjs')), true)
    assert.equal(command.includes(packageRootForTest()), false)
  }
})

test('a changed Codex hook tells the developer to trust it in /hooks, and an unchanged one stays quiet', async () => {
  const root = temporaryRoot()
  const project = path.join(root, 'project')
  fs.mkdirSync(project, { recursive: true })
  const install = async () => {
    let text = ''
    await executeInstall({
      command: 'install', platform: 'codex', method: 'direct', scope: 'project', policy: false
    }, { output: { write(chunk) { text += chunk } }, homeDir: root, cwd: project })
    return text
  }
  assert.equal((await install()).includes(CODEX_HOOK_TRUST_NOTICE), true)
  assert.equal((await install()).includes(CODEX_HOOK_TRUST_NOTICE), false)
})

test('managed hook updates replace only the exact Agent OS entry', () => {
  const durableScript = path.join(temporaryRoot(), '.codex', 'skills', 'quality-ratchet', 'scripts', 'quality-delta.mjs')
  const managedCommand = buildManagedHookCommand(durableScript)
  const oldCommand = '"old-node" "old-quality-delta.mjs" hook --agent-os-hook=quality-ratchet'
  const original = JSON.stringify({
    unrelated: true,
    hooks: {
      Stop: [
        { hooks: [{ type: 'command', command: 'keep-me' }] },
        { hooks: [{ type: 'command', command: oldCommand, timeout: 1 }] }
      ]
    }
  }, null, 2) + '\n'
  const planned = planManagedHookConfig(original, managedCommand, 'test hooks.json')
  assert.equal(planned.status, 'UPDATED')
  const config = JSON.parse(planned.content)
  assert.equal(config.unrelated, true)
  assert.equal(config.hooks.Stop[0].hooks[0].command, 'keep-me')
  assert.equal(config.hooks.Stop[1].hooks[0].command, managedCommand)
  assert.equal(config.hooks.Stop[1].hooks[0].timeout, 10)
  assert.equal(config.hooks.Stop[1].hooks[0].command.includes(durableScript), true)
})

test('malformed or ambiguous managed hook config aborts before direct skill mutation', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const hookFile = path.join(homeDir, '.codex', 'hooks.json')
  fs.mkdirSync(path.dirname(hookFile), { recursive: true })
  fs.writeFileSync(hookFile, '{ malformed')
  await assert.rejects(
    executeInstall({ command: 'install', platform: 'codex', method: 'direct', scope: 'user', policy: false }, {
      output: silentOutput(), homeDir, cwd: root
    }),
    /Cannot read.*hooks.json.*no files were changed/
  )
  assert.equal(fs.existsSync(path.join(homeDir, '.codex', 'skills')), false)

  fs.writeFileSync(hookFile, JSON.stringify({ hooks: { Stop: [
    { hooks: [{ type: 'command', command: 'one --agent-os-hook=quality-ratchet' }] },
    { hooks: [{ type: 'command', command: 'two --agent-os-hook=quality-ratchet' }] }
  ] } }))
  await assert.rejects(
    executeInstall({ command: 'install', platform: 'codex', method: 'direct', scope: 'user', policy: false }, {
      output: silentOutput(), homeDir, cwd: root
    }),
    /multiple Agent OS hook entries.*no files were changed/
  )
  assert.equal(fs.existsSync(path.join(homeDir, '.codex', 'skills')), false)
})

test('hook write failure restores both direct skill installs and preserves host configs byte-for-byte', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const claudeConfig = path.join(homeDir, '.claude', 'settings.json')
  const codexConfig = path.join(homeDir, '.codex', 'hooks.json')
  const claudeText = '{\n  "theme": "dark",\n  "hooks": { "Stop": [] }\n}\n'
  const codexText = '{\n  "custom": true,\n  "hooks": { "Stop": [] }\n}\n'
  for (const [file, content] of [[claudeConfig, claudeText], [codexConfig, codexText]]) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }

  const skillRoots = [
    path.join(homeDir, '.claude', 'skills'),
    path.join(homeDir, '.codex', 'skills')
  ]
  for (const skillsRoot of skillRoots) {
    const privateFile = path.join(skillsRoot, 'private-skill', 'SKILL.md')
    fs.mkdirSync(path.dirname(privateFile), { recursive: true })
    fs.writeFileSync(privateFile, 'developer-owned\n')
  }

  const failingFs = Object.create(fs)
  let injected = false
  failingFs.writeFileSync = (target, ...args) => {
    const isCodexHookTemporary = path.dirname(target) === path.dirname(codexConfig) &&
      path.basename(target).startsWith('.hooks.json.agent-os-')
    if (!injected && isCodexHookTemporary) {
      injected = true
      throw new Error('injected hook write failure')
    }
    return fs.writeFileSync(target, ...args)
  }

  await assert.rejects(
    executeInstall({ command: 'install', platform: 'both', method: 'direct', scope: 'user', policy: false }, {
      output: silentOutput(), homeDir, cwd: root, fsImpl: failingFs
    }),
    /injected hook write failure/
  )

  assert.equal(injected, true)
  assert.equal(fs.readFileSync(claudeConfig, 'utf8'), claudeText)
  assert.equal(fs.readFileSync(codexConfig, 'utf8'), codexText)
  for (const skillsRoot of skillRoots) {
    assert.equal(fs.readFileSync(path.join(skillsRoot, 'private-skill', 'SKILL.md'), 'utf8'), 'developer-owned\n')
    assert.equal(fs.existsSync(path.join(skillsRoot, INSTALL_MANIFEST)), false)
    assert.equal(fs.existsSync(path.join(skillsRoot, 'shape-work')), false)
    assert.equal(fs.existsSync(path.join(skillsRoot, 'quality-ratchet')), false)
    assert.deepEqual(fs.readdirSync(skillsRoot).filter((name) => name.startsWith('.agent-os-transaction-')), [])
  }
  for (const file of [claudeConfig, codexConfig]) {
    assert.deepEqual(fs.readdirSync(path.dirname(file)).filter((name) => name.endsWith('.tmp')), [])
  }
})

test('post-commit backup cleanup failure never rolls back installed skills or hooks', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const options = {
    command: 'install', platform: 'both', method: 'direct', scope: 'user', policy: false
  }
  await executeInstall(options, { output: silentOutput(), homeDir, cwd: root })

  const skillRoots = [
    path.join(homeDir, '.claude', 'skills'),
    path.join(homeDir, '.codex', 'skills')
  ]
  const failingFs = Object.create(fs)
  let firstBackupRemoved = false
  let injected = false
  let rollbackAttempted = false
  failingFs.rmSync = (target, rmOptions) => {
    const isTransactionBackup = path.basename(target).startsWith('.agent-os-transaction-')
    if (isTransactionBackup && path.dirname(target) === skillRoots[0]) {
      firstBackupRemoved = true
    } else if (!injected && firstBackupRemoved && isTransactionBackup &&
        path.dirname(target) === skillRoots[1]) {
      injected = true
      throw new Error('injected post-commit cleanup failure')
    } else if (injected && skillRoots.some((skillsRoot) => path.dirname(target) === skillsRoot)) {
      rollbackAttempted = true
    }
    return fs.rmSync(target, rmOptions)
  }

  await assert.rejects(
    executeInstall({ ...options, command: 'update' }, {
      output: silentOutput(), homeDir, cwd: root, fsImpl: failingFs
    }),
    /direct install committed, but failed to clean transaction backups: injected post-commit cleanup failure.*not rolled back/
  )

  assert.equal(firstBackupRemoved, true)
  assert.equal(injected, true)
  assert.equal(rollbackAttempted, false)
  for (const [index, skillsRoot] of skillRoots.entries()) {
    const manifest = JSON.parse(fs.readFileSync(path.join(skillsRoot, INSTALL_MANIFEST), 'utf8'))
    assert.equal(manifest.schemaVersion, 2)
    assert.equal(manifest.skills.includes('quality-ratchet'), true)
    for (const name of manifest.skills) assert.equal(fs.existsSync(path.join(skillsRoot, name)), true)

    const hookFile = index === 0
      ? path.join(homeDir, '.claude', 'settings.json')
      : path.join(homeDir, '.codex', 'hooks.json')
    const hookConfig = JSON.parse(fs.readFileSync(hookFile, 'utf8'))
    const managedHooks = hookConfig.hooks.Stop.filter((group) =>
      JSON.stringify(group).includes('--agent-os-hook=quality-ratchet'))
    assert.equal(managedHooks.length, 1)
    assert.equal(managedHooks[0].hooks[0].command.includes(
      path.join(skillsRoot, 'quality-ratchet', 'scripts', 'quality-delta.mjs')), true)
  }
  assert.deepEqual(fs.readdirSync(skillRoots[0]).filter((name) =>
    name.startsWith('.agent-os-transaction-')), [])
  assert.equal(fs.readdirSync(skillRoots[1]).filter((name) =>
    name.startsWith('.agent-os-transaction-')).length, 1)
})

test('upgrades a schema 1 direct manifest while retaining managed integration state', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const options = { command: 'install', platform: 'codex', method: 'direct', scope: 'user', policy: false }
  await executeInstall(options, { output: silentOutput(), homeDir, cwd: root })
  const skillsRoot = path.join(homeDir, '.codex', 'skills')
  const manifestPath = path.join(skillsRoot, INSTALL_MANIFEST)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  delete manifest.integrations
  manifest.schemaVersion = 1
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  await executeInstall({ ...options, command: 'update' }, { output: silentOutput(), homeDir, cwd: root })
  const upgraded = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.equal(upgraded.schemaVersion, 2)
  assert.equal(upgraded.integrations.hooks.marker, '--agent-os-hook=quality-ratchet')
})

test('packaged hook asset and direct command use the stable runner marker', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRootForTest(), 'package.json'), 'utf8'))
  const hooks = JSON.parse(fs.readFileSync(path.join(packageRootForTest(), 'hooks', 'hooks.json'), 'utf8'))
  const durableScript = path.join(temporaryRoot(), '.claude', 'skills', 'quality-ratchet', 'scripts', 'quality-delta.mjs')
  const command = buildManagedHookCommand(durableScript)
  const nativeHook = hooks.hooks.Stop[0].hooks[0]
  assert.ok(packageJson.files.includes('hooks/'))
  assert.equal(hooks.description.includes('quality-ratchet'), true)
  assert.match(nativeHook.command, /\$\{CLAUDE_PLUGIN_ROOT\}/)
  assert.equal(typeof nativeHook.commandWindows, 'string')
  assert.equal(nativeHook.commandWindows.includes('"'), false)
  const windowsMatch =
    /^powershell\.exe -NoProfile -NonInteractive -EncodedCommand ([A-Za-z0-9+/]+={0,2})$/.exec(
      nativeHook.commandWindows
    )
  assert.ok(windowsMatch)
  const decodedWindowsCommand = Buffer.from(windowsMatch[1], 'base64').toString('utf16le')
  assert.equal(decodedWindowsCommand,
    "$runner = Join-Path $env:PLUGIN_ROOT 'skills\\quality-ratchet\\scripts\\quality-delta.mjs'; " +
    'node $runner hook --agent-os-hook=quality-ratchet')
  assert.equal(command.startsWith('"' + process.execPath + '"'), true)
  assert.equal(path.isAbsolute(durableScript), true)
  assert.match(command, /--agent-os-hook=quality-ratchet/)
})

test('updates only managed skills and preserves unrelated skills', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const options = {
    command: 'install',
    platform: 'codex',
    method: 'direct',
    scope: 'user',
    policy: false
  }
  await executeInstall(options, { output: silentOutput(), homeDir, cwd: root })

  const skillsRoot = path.join(homeDir, '.codex', 'skills')
  const managedFile = path.join(skillsRoot, 'shape-work', 'SKILL.md')
  const foreignFile = path.join(skillsRoot, 'my-private-skill', 'SKILL.md')
  fs.writeFileSync(managedFile, 'stale managed content\n')
  fs.mkdirSync(path.dirname(foreignFile), { recursive: true })
  fs.writeFileSync(foreignFile, 'private content\n')

  await executeInstall({ ...options, command: 'update' }, { output: silentOutput(), homeDir, cwd: root })
  assert.notEqual(fs.readFileSync(managedFile, 'utf8'), 'stale managed content\n')
  assert.equal(fs.readFileSync(foreignFile, 'utf8'), 'private content\n')
})

test('refuses to overwrite a same-name skill without an Agent OS manifest', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const collision = path.join(homeDir, '.codex', 'skills', 'shape-work', 'SKILL.md')
  fs.mkdirSync(path.dirname(collision), { recursive: true })
  fs.writeFileSync(collision, 'developer-owned\n')

  await assert.rejects(
    executeInstall({
      command: 'install',
      platform: 'codex',
      method: 'direct',
      scope: 'user',
      policy: false
    }, { output: silentOutput(), homeDir, cwd: root }),
    /Refusing to overwrite unmanaged skills.*shape-work/
  )
  assert.equal(fs.readFileSync(collision, 'utf8'), 'developer-owned\n')
  assert.equal(fs.existsSync(path.join(homeDir, '.codex', 'skills', INSTALL_MANIFEST)), false)
})

test('policy planning preserves surrounding text and rejects malformed markers', () => {
  const policy = '# Policy\n'
  const original = 'before\n\n<!-- BEGIN AGENT OS -->\nold\n<!-- END AGENT OS -->\nafter\n'
  const updated = planPolicyUpdate(original, policy)
  assert.equal(updated.status, 'UPDATED')
  assert.equal(updated.content, 'before\n\n<!-- BEGIN AGENT OS -->\n# Policy\n<!-- END AGENT OS -->\nafter\n')
  assert.throws(
    () => planPolicyUpdate('<!-- BEGIN AGENT OS -->\nbroken\n', policy),
    /Malformed Agent OS policy markers/
  )

  const versioned = planPolicyUpdate(updated.content, policy, '9.9.9')
  assert.equal(versioned.status, 'UPDATED')
  assert.equal(policyBlockVersion(versioned.content), '9.9.9')
  assert.match(versioned.content, /<!-- BEGIN AGENT OS -->\n<!-- agent-os version 9\.9\.9 -->\n# Policy\n/)
  assert.equal(planPolicyUpdate(versioned.content, policy, '9.9.9').status, 'OK')
  assert.equal(policyBlockVersion('no block here'), null)
})

test('policy sync follows the selected platform and the installed policy script works without a checkout', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  await executeInstall({
    command: 'install',
    platform: 'codex',
    method: 'direct',
    scope: 'user',
    policy: true
  }, { output: silentOutput(), homeDir, cwd: root })

  const installedPolicy = fs.readFileSync(path.join(homeDir, '.codex', 'AGENTS.md'), 'utf8')
  assert.match(installedPolicy, /BEGIN AGENT OS/)
  assert.equal(policyBlockVersion(installedPolicy), VERSION)
  assert.equal(fs.existsSync(path.join(homeDir, '.claude', 'CLAUDE.md')), false)

  const script = path.join(homeDir, '.codex', 'skills', 'init-agent-os', 'scripts', 'policy-block.mjs')
  // The installed skill resolves the same version from the install manifest, so it sees no drift.
  const installedCheck = spawnSync(process.execPath, [script, '--check', '--target', path.join(homeDir, '.codex', 'AGENTS.md')], { encoding: 'utf8' })
  assert.equal(installedCheck.status, 0, installedCheck.stdout + installedCheck.stderr)
  const target = path.join(root, 'CLAUDE.md')
  fs.writeFileSync(target, '# Mine\n')
  const run = (...args) => spawnSync(process.execPath, [script, '--target', target, ...args], { encoding: 'utf8' })
  assert.equal(run('--check').status, 1)
  assert.equal(fs.readFileSync(target, 'utf8'), '# Mine\n')
  assert.equal(run().status, 0)
  assert.equal(run('--check').status, 0)
  assert.match(fs.readFileSync(target, 'utf8'), /^# Mine\n\n<!-- BEGIN AGENT OS -->/)
})

test('malformed policy markers abort before direct skill installation', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const target = path.join(homeDir, '.codex', 'AGENTS.md')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, '<!-- BEGIN AGENT OS -->\nbroken\n')

  await assert.rejects(
    executeInstall({
      command: 'install',
      platform: 'codex',
      method: 'direct',
      scope: 'user',
      policy: true
    }, { output: silentOutput(), homeDir, cwd: root }),
    /Malformed Agent OS policy markers/
  )
  assert.equal(fs.existsSync(path.join(homeDir, '.codex', 'skills')), false)
})

test('plugin mode still requires only the selected host CLI', async () => {
  const calls = []
  await assert.rejects(
    executeInstall({
      command: 'install',
      platform: 'codex',
      method: 'plugin',
      scope: 'user',
      policy: false
    }, {
      output: silentOutput(),
      exists: () => false,
      execute: (...args) => calls.push(args)
    }),
    /Native plugin mode requires the selected host CLIs.*Codex/s
  )
  assert.deepEqual(calls, [])
})

test('plugin update skips Git refresh for a registered local Codex marketplace', async () => {
  const calls = []
  await executeInstall({
    command: 'update',
    platform: 'codex',
    method: 'plugin',
    scope: 'user',
    policy: false
  }, {
    output: silentOutput(),
    exists: () => true,
    execute: (command, args) => {
      calls.push([command, args])
      if (args.join(' ') === 'plugin marketplace list --json') {
        return { status: 0, stdout: JSON.stringify({ marketplaces: [{ name: 'agent-os' }] }), stderr: '' }
      }
      if (args.join(' ') === 'plugin list --json') {
        return {
          status: 0,
          stdout: JSON.stringify({ installed: [{
            marketplaceName: 'agent-os',
            marketplaceSource: { sourceType: 'local' }
          }] }),
          stderr: ''
        }
      }
      return { status: 0, stdout: '', stderr: '' }
    }
  })

  assert.deepEqual(calls.map((call) => call[1]), [
    ['plugin', 'marketplace', 'list', '--json'],
    ['plugin', 'list', '--json'],
    ['plugin', 'add', 'agent-os@agent-os']
  ])
})

test('doctor reports a current install as clean and names drift with the fixing command', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const cwd = path.join(root, 'project')
  fs.mkdirSync(cwd, { recursive: true })
  await executeInstall({
    command: 'install', platform: 'codex', method: 'direct', scope: 'user', policy: true
  }, { output: silentOutput(), homeDir, cwd })

  const doctor = async (args = ['doctor', '--offline'], extra = {}) => {
    let text = ''
    const code = await run(args, { output: { write(chunk) { text += chunk } }, homeDir, cwd, ...extra })
    return { code, text }
  }
  const clean = await doctor()
  assert.equal(clean.code, 0, clean.text)
  assert.match(clean.text, /OK {4}codex direct user .*version /)
  assert.match(clean.text, /OK {4}codex global policy/)
  assert.match(clean.text, /No version drift found/)

  const outdated = await doctor(['doctor'], { latestVersion: () => '999.0.0' })
  assert.match(outdated.text, /WARN {2}installer: .*latest published version is 999\.0\.0/)

  const skillsRoot = path.join(homeDir, '.codex', 'skills')
  const manifestPath = path.join(skillsRoot, INSTALL_MANIFEST)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.version = '0.1.0'
  manifest.skills.push('retired-skill')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  fs.mkdirSync(path.join(skillsRoot, 'retired-skill'))
  fs.writeFileSync(path.join(skillsRoot, 'retired-skill', 'SKILL.md'), '---\nname: retired-skill\n---\n')
  fs.mkdirSync(path.join(homeDir, '.claude', 'plugins'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify({
    plugins: { 'agent-os@agent-os-marketplace': [{ scope: 'user', version: '0.2.0' }] }
  }))
  const policyPath = path.join(homeDir, '.codex', 'AGENTS.md')
  fs.writeFileSync(policyPath, fs.readFileSync(policyPath, 'utf8').replace(/<!-- agent-os version [^>]+ -->\n/, ''))

  const drifted = await doctor()
  assert.equal(drifted.code, 1)
  assert.match(drifted.text, /DRIFT codex direct user .*installed 0\.1\.0.*update --platform codex --scope user/)
  assert.match(drifted.text, /retired skills still installed: retired-skill/)
  assert.match(drifted.text, /DRIFT claude plugin agent-os@agent-os-marketplace \(user\): recorded version 0\.2\.0/)
  assert.match(drifted.text, /DRIFT codex global policy .*no version line/)
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), JSON.stringify(manifest))
})

test('doctor finds no installation and suggests install', async () => {
  const root = temporaryRoot()
  let text = ''
  const code = await run(['doctor', '--offline'], {
    output: { write(chunk) { text += chunk } }, homeDir: path.join(root, 'home'), cwd: root
  })
  assert.equal(code, 0)
  assert.match(text, /no Agent OS installation found/)
})

function snapshotTree(root) {
  const entries = []
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        entries.push(['dir', path.relative(root, file)])
        visit(file)
      } else {
        entries.push(['file', path.relative(root, file), fs.readFileSync(file, 'utf8')])
      }
    }
  }
  visit(root)
  return entries
}

async function runDoctor(homeDir, cwd, args = ['doctor', '--offline'], extra = {}) {
  let text = ''
  const code = await run(args, { output: { write(chunk) { text += chunk } }, homeDir, cwd, ...extra })
  return { code, text }
}

test('doctor reports broken install files as findings instead of crashing, and writes nothing', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const cwd = path.join(root, 'project')
  fs.mkdirSync(cwd, { recursive: true })
  fs.mkdirSync(path.join(homeDir, '.claude', 'skills'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.claude', 'skills', INSTALL_MANIFEST), 'null')
  fs.mkdirSync(path.join(homeDir, '.claude', 'CLAUDE.md'), { recursive: true })
  fs.mkdirSync(path.join(homeDir, '.claude', 'plugins'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ plugins: { 'agent-os@m': [null, 5, 'text'] } }))
  fs.mkdirSync(path.join(homeDir, '.codex', 'plugins'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.codex', 'plugins', 'cache'), 'not a directory')
  await executeInstall({
    command: 'install', platform: 'codex', method: 'direct', scope: 'project', policy: false
  }, { output: silentOutput(), homeDir, cwd })
  fs.rmSync(path.join(cwd, '.codex', 'hooks.json'))
  fs.mkdirSync(path.join(cwd, '.codex', 'hooks.json'))

  const before = snapshotTree(root)
  const result = await runDoctor(homeDir, cwd)
  assert.deepEqual(snapshotTree(root), before)
  assert.equal(result.code, 1, result.text)
  assert.match(result.text, /DRIFT claude direct user .*is not a readable Agent OS install manifest.*Move it aside/)
  assert.match(result.text, /WARN {2}codex direct project .*cannot read .*hooks\.json/)
  assert.match(result.text, /WARN {2}claude global policy .*cannot read the file/)
  assert.doesNotMatch(result.text, /no Agent OS installation found/)
})

test('doctor covers plugin caches, duplicates, strays, scopes, and in-place local marketplaces', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  const cwd = path.join(root, 'project')
  fs.mkdirSync(cwd, { recursive: true })
  await executeInstall({
    command: 'install', platform: 'codex', method: 'direct', scope: 'user', policy: false
  }, { output: silentOutput(), homeDir, cwd })
  const cache = path.join(homeDir, '.codex', 'plugins', 'cache', 'agent-os', 'agent-os')
  fs.mkdirSync(path.join(cache, '0.1.0'), { recursive: true })
  fs.writeFileSync(path.join(cache, '.DS_Store'), '')
  fs.mkdirSync(path.join(homeDir, '.agents', 'skills', 'shape-work'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.agents', 'skills', 'shape-work', 'SKILL.md'), '---\nname: shape-work\n---\n')

  const checkout = path.join(root, 'checkout')
  fs.mkdirSync(path.join(checkout, '.claude-plugin'), { recursive: true })
  fs.writeFileSync(path.join(checkout, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'agent-os', version: VERSION }))
  const plugins = path.join(homeDir, '.claude', 'plugins')
  fs.mkdirSync(plugins, { recursive: true })
  fs.writeFileSync(path.join(plugins, 'known_marketplaces.json'), JSON.stringify({
    local: { source: { source: 'directory', path: checkout }, installLocation: checkout },
    remote: { source: { source: 'github', repo: 'sockulags/agent-os' } }
  }))
  fs.writeFileSync(path.join(plugins, 'installed_plugins.json'), JSON.stringify({ plugins: {
    'agent-os@local': [{ scope: 'user', version: '0.2.0' }],
    'agent-os@remote': [{ scope: 'project', version: '0.1.0' }]
  } }))

  const { code, text } = await runDoctor(homeDir, cwd)
  assert.equal(code, 1)
  assert.match(text, /DRIFT codex plugin agent-os@agent-os: cached version 0\.1\.0/)
  assert.doesNotMatch(text, /\.DS_Store/)
  assert.match(text, /WARN {2}codex: both the plugin and a direct install are present.*Keep one/)
  assert.match(text, /Agent OS skills outside the managed install: shape-work/)
  assert.match(text, /OK {4}claude plugin agent-os@local \(user\): loaded in place from .*version /)
  assert.match(text, /claude plugin update agent-os@remote --scope project/)
})

test('doctor names a policy-only fix for plugin users and handles a CLI newer than npm', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  fs.mkdirSync(path.join(homeDir, '.claude', 'plugins'), { recursive: true })
  fs.writeFileSync(path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify({
    plugins: { 'agent-os@remote': [{ scope: 'user', version: VERSION }] }
  }))
  fs.writeFileSync(path.join(homeDir, '.claude', 'CLAUDE.md'), '# Mine\n')
  const { text } = await runDoctor(homeDir, root, ['doctor'], { latestVersion: () => '0.0.1' })
  assert.match(text, /WARN {2}claude global policy .*no Agent OS block\. To add it: run \/agent-os:init-agent-os global/)
  assert.match(text, /INFO {2}installer: this CLI is .* newer than the published 0\.0\.1/)
})

test('version comparison and the npm lookup tolerate odd input', () => {
  assert.ok(compareVersions('0.16.0', '0.15.9') > 0)
  assert.equal(compareVersions('0.15.0', '0.15.0-beta.1'), 0)
  assert.ok(compareVersions('1.0.0', '0.99.99') > 0)
  const calls = []
  const spawn = (command, options) => {
    calls.push([command, options.shell])
    return { status: 0, stdout: '1.2.3\n' }
  }
  assert.equal(latestPublishedVersion('@sockulags/agent-os', { spawn }), '1.2.3')
  assert.deepEqual(calls, [['npm view @sockulags/agent-os version', true]])
  assert.equal(latestPublishedVersion('@sockulags/agent-os', { spawn: () => ({ status: 1, stdout: '' }) }), null)
  assert.equal(latestPublishedVersion('@sockulags/agent-os', { spawn: () => ({ status: 0, stdout: 'npm warn\n' }) }), null)
  assert.equal(latestPublishedVersion('@sockulags/agent-os', { spawn: () => { throw new Error('spawn failed') } }), null)
  assert.equal(latestPublishedVersion('x; rm -rf /', { spawn }), null)
  assert.equal(calls.length, 1)
})

test('the policy script reads the version from a plugin or checkout package.json and ignores other packages', () => {
  const root = temporaryRoot()
  const scriptDir = path.join(root, 'skills', 'init-agent-os', 'scripts')
  fs.mkdirSync(scriptDir, { recursive: true })
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'other-package', version: '9.9.9' }))
  assert.equal(resolvePolicyVersion(scriptDir), null)
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: PACKAGE_NAME, version: '1.2.3' }))
  assert.equal(resolvePolicyVersion(scriptDir), '1.2.3')
  fs.writeFileSync(path.join(root, 'skills', INSTALL_MANIFEST), JSON.stringify({ version: '2.0.0' }))
  assert.equal(resolvePolicyVersion(scriptDir), '2.0.0')
})

test('doctor names the recorded Claude plugin key and gives no install advice for an unreadable plugin record', async () => {
  const root = temporaryRoot()
  const homeDir = path.join(root, 'home')
  await executeInstall({
    command: 'install', platform: 'claude', method: 'direct', scope: 'user', policy: false
  }, { output: silentOutput(), homeDir, cwd: root })
  const plugins = path.join(homeDir, '.claude', 'plugins')
  fs.mkdirSync(plugins, { recursive: true })
  fs.writeFileSync(path.join(plugins, 'installed_plugins.json'), JSON.stringify({
    plugins: { 'agent-os@team': [{ scope: 'user', version: VERSION }] }
  }))
  const duplicate = await runDoctor(homeDir, root)
  assert.match(duplicate.text, /Keep one: claude plugin uninstall agent-os@team, or delete/)
  assert.doesNotMatch(duplicate.text, /agent-os@agent-os-marketplace/)

  const unreadableHome = path.join(root, 'unreadable')
  fs.mkdirSync(path.join(unreadableHome, '.claude', 'plugins'), { recursive: true })
  fs.writeFileSync(path.join(unreadableHome, '.claude', 'plugins', 'installed_plugins.json'), '{ not json')
  fs.writeFileSync(path.join(unreadableHome, '.claude', 'CLAUDE.md'), '# Mine\n')
  const unreadable = await runDoctor(unreadableHome, root)
  assert.match(unreadable.text, /WARN {2}claude plugins: cannot read/)
  assert.doesNotMatch(unreadable.text, /no Agent OS installation found/)
  assert.doesNotMatch(unreadable.text, /install --platform claude/)
  assert.match(unreadable.text, /To add it: run \/agent-os:init-agent-os global/)
})
