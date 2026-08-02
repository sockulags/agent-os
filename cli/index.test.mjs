import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import {
  buildPlan,
  executeInstall,
  INSTALL_MANIFEST,
  PACKAGE_NAME,
  parseArgs,
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
  assert.deepEqual(plan.map((step) => step.kind), ['install-skills', 'install-skills'])
  assert.deepEqual(plan.map((step) => step.command), ['filesystem', 'filesystem'])
  assert.equal(plan[0].args[0], path.join(root, '.claude', 'skills'))
  assert.equal(plan[1].args[0], path.join(root, '.codex', 'skills'))
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
    assert.ok(manifest.skills.includes('shape-work'))
  }
  assert.match(fs.readFileSync(path.join(homeDir, '.claude', 'CLAUDE.md'), 'utf8'), /BEGIN AGENT OS/)
  assert.match(fs.readFileSync(path.join(homeDir, '.codex', 'AGENTS.md'), 'utf8'), /BEGIN AGENT OS/)
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
