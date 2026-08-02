import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPlan, executeInstall, parseArgs, resolveOptions } from './index.mjs'

test('defaults to guided install', () => {
  assert.deepEqual(parseArgs([]), {
    command: 'install',
    platform: null,
    scope: null,
    policy: null,
    yes: false,
    dryRun: false,
    help: false,
    version: false
  })
})

test('parses non-interactive update flags', () => {
  assert.deepEqual(parseArgs([
    'update',
    '--platform=both',
    '--scope',
    'project',
    '--no-policy',
    '--yes'
  ]), {
    command: 'update',
    platform: 'both',
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
    scope: null,
    policy: null,
    yes: true,
    dryRun: false,
    help: false,
    version: false
  })
})

test('rejects conflicting policy flags', () => {
  assert.throws(() => parseArgs(['install', '--policy', '--no-policy']), /one of --policy and --no-policy/)
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

test('builds a Codex install plan without policy mutation', () => {
  const plan = buildPlan({
    command: 'install',
    platform: 'codex',
    scope: 'user',
    policy: false
  })
  assert.deepEqual(plan.map((step) => step.kind), [
    'ensure-marketplace',
    'add-marketplace-if-missing',
    'install-plugin'
  ])
  assert.deepEqual(plan.at(-1).args, ['plugin', 'add', 'agent-os@agent-os'])
})

test('reports a missing host before running installation commands', async () => {
  const calls = []
  await assert.rejects(
    executeInstall({
      command: 'install',
      platform: 'codex',
      scope: 'user',
      policy: false
    }, {
      output: { write() {} },
      exists: () => false,
      execute: (...args) => calls.push(args)
    }),
    /Codex CLI was not found on PATH/
  )
  assert.deepEqual(calls, [])
})

test('updates both platforms and syncs policy through the host CLIs', async () => {
  const calls = []
  const output = { write() {} }
  await executeInstall({
    command: 'update',
    platform: 'both',
    scope: 'user',
    policy: true
  }, {
    output,
    exists: () => true,
    spawn: () => ({ status: 0 }),
    execute: (command, args, options = {}) => {
      calls.push({ command, args, options })
      if (options.capture) {
        return {
          status: 0,
          stdout: JSON.stringify({ marketplaces: [] }),
          stderr: ''
        }
      }
      return { status: 0, stdout: '', stderr: '' }
    }
  })

  assert.deepEqual(calls.map((call) => [call.command, call.args]), [
    ['claude', ['plugin', 'marketplace', 'list', '--json']],
    ['claude', ['plugin', 'marketplace', 'add', 'sockulags/agent-os']],
    ['claude', ['plugin', 'marketplace', 'update', 'agent-os-marketplace']],
    ['claude', ['plugin', 'install', 'agent-os@agent-os-marketplace', '--scope', 'user']],
    ['codex', ['plugin', 'marketplace', 'list', '--json']],
    ['codex', ['plugin', 'marketplace', 'add', 'sockulags/agent-os']],
    ['codex', ['plugin', 'marketplace', 'upgrade', 'agent-os']],
    ['codex', ['plugin', 'add', 'agent-os@agent-os']],
    ['pwsh', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', calls.at(-1)?.args?.at(-1)]]
  ])
})
