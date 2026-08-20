import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  buildManagedHookCommand,
  buildPlan,
  executeInstall,
  hookConfigPath,
  INSTALL_MANIFEST,
  PACKAGE_NAME,
  parseArgs,
  planManagedHookConfig,
  planPolicyUpdate,
  resolveOptions,
  run,
  targetSkillRoot,
  VERSION
} from './index.mjs'

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
    version: false
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
    version: false
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
    version: false
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
  assert.ok(packageJson.files.includes('hooks/'))
  assert.equal(hooks.description.includes('quality-ratchet'), true)
  assert.match(hooks.hooks.Stop[0].hooks[0].command, /CLAUDE_PLUGIN_ROOT/)
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
