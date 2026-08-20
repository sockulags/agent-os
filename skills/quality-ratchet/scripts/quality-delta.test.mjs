import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  begin,
  check,
  clear,
  hook
} from './quality-delta.mjs'

const temporaryRoots = []

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-quality-'))
  temporaryRoots.push(root)
  return root
}

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function initializedRepository() {
  const root = temporaryRoot()
  git(root, 'init', '-q')
  git(root, 'config', 'user.email', 'quality@example.invalid')
  git(root, 'config', 'user.name', 'Quality Test')
  return root
}

function repository() {
  const root = initializedRepository()
  fs.mkdirSync(path.join(root, 'src'), { recursive: true })
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), 'export function legacy() {\n  return 1\n}\n')
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'quality-fixture',
    version: '1.0.0',
    dependencies: { before: '1.0.0' }
  }, null, 2) + '\n')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'fixture')
  return root
}

function unavailableAnalyzers() {
  return {
    lizard: { status: 'unavailable', available: false, integrated: false, reason: 'test analyzer is absent' },
    jscpd: { status: 'unavailable', available: false, integrated: false, reason: 'test analyzer is absent' }
  }
}

function parseStopHookResult(result, host) {
  // Claude Code and Codex parse structured stdout on exit 0; exit 2 ignores stdout and uses stderr.
  if (result.status === 0) return JSON.parse(result.stdout || '{}')
  if (result.status === 2 && result.stderr.trim()) {
    return { decision: 'block', reason: result.stderr.trim() }
  }
  throw new Error(`${host} rejected the command hook result.`)
}

after(() => {
  for (const root of temporaryRoots) fs.rmSync(root, { recursive: true, force: true })
})

test('captures the exact dirty entry state and reports source/dependency deltas', () => {
  const root = repository()
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), 'export function legacy() {\n  return 2\n}\n')
  fs.writeFileSync(path.join(root, 'src', 'preexisting.js'), 'export const before = true\n')

  const started = begin(root, { detect: unavailableAnalyzers })
  const entry = JSON.parse(fs.readFileSync(started.statePath, 'utf8'))
  assert.ok(entry.entry.files.some((file) => file.path === 'src/preexisting.js'))
  assert.deepEqual(entry.entry.dirtyPaths, ['src/legacy.js', 'src/preexisting.js'])

  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), 'export function legacy() {\n  return 3\n}\n')
  fs.writeFileSync(path.join(root, 'src', 'new.js'), 'export const added = true\n')
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'quality-fixture',
    version: '1.0.0',
    dependencies: { before: '1.0.0', after: '2.0.0' }
  }, null, 2) + '\n')

  const evidence = check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(evidence.sourceFiles.added, ['src/new.js'])
  assert.deepEqual(evidence.sourceFiles.changed, ['src/legacy.js'])
  assert.deepEqual(evidence.sourceFiles.deleted, [])
  assert.equal(evidence.sourceFiles.added.includes('src/preexisting.js'), false)
  assert.equal(evidence.touchedLegacy.before.status, 'touched')
  assert.deepEqual(evidence.touchedLegacy.before.files, ['src/legacy.js'])
  assert.deepEqual(evidence.packageDependencies.added, [{
    section: 'dependencies',
    name: 'after',
    version: '2.0.0'
  }])
  assert.deepEqual(evidence.packageDependencies.removed, [])
  assert.equal(evidence.optionalAnalyzers.candidate.lizard.status, 'unavailable')
  assert.match(evidence.optionalAnalyzers.candidate.lizard.reason, /absent/)
})

test('reports the first committed source delta from an unborn baseline', () => {
  const root = initializedRepository()
  const started = begin(root, { detect: unavailableAnalyzers })
  fs.writeFileSync(path.join(root, 'src.js'), 'export const first = true\n')
  git(root, 'add', 'src.js')
  git(root, 'commit', '-qm', 'first commit')

  const evidence = check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(evidence.sourceFiles.added, ['src.js'])
  assert.deepEqual(evidence.sourceFiles.changed, [])
  assert.deepEqual(evidence.sourceFiles.deleted, [])
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  assert.equal(fs.existsSync(started.statePath), false)
})

test('classifies a tracked file-to-missing transition as deleted', () => {
  const root = repository()
  begin(root, { detect: unavailableAnalyzers })
  fs.rmSync(path.join(root, 'src', 'legacy.js'))

  const evidence = check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(evidence.sourceFiles.added, [])
  assert.deepEqual(evidence.sourceFiles.changed, [])
  assert.deepEqual(evidence.sourceFiles.deleted, ['src/legacy.js'])
  assert.deepEqual(evidence.touchedLegacy.after, { status: 'none', files: [] })
})

test('keeps staged deletion and rename present at begin in the baseline', () => {
  const scenarios = [
    {
      name: 'staged deletion',
      prepare(root) {
        git(root, 'rm', '-q', 'src/legacy.js')
      }
    },
    {
      name: 'staged rename',
      prepare(root) {
        git(root, 'mv', 'src/legacy.js', 'src/renamed.js')
      }
    }
  ]

  for (const scenario of scenarios) {
    const root = repository()
    scenario.prepare(root)
    begin(root, { detect: unavailableAnalyzers })
    const evidence = check(root, { detect: unavailableAnalyzers })
    assert.deepEqual(evidence.sourceFiles, { added: [], changed: [], deleted: [] }, scenario.name)
  }
})

test('begin refuses to overwrite an active baseline and check requires a baseline', () => {
  const root = repository()
  assert.throws(() => check(root), /No active quality ratchet baseline/)
  const started = begin(root, { detect: unavailableAnalyzers })
  assert.throws(() => begin(root, { detect: unavailableAnalyzers }), /already exists/)
  clear(root)
  assert.equal(fs.existsSync(started.statePath), false)
})

test('optional analyzer crashes remain explicit advisory unavailability', () => {
  const root = repository()
  const crashed = () => { throw new Error('analyzer process failed') }
  begin(root, { detect: crashed })
  const evidence = check(root, { detect: crashed })
  assert.equal(evidence.optionalAnalyzers.candidate.jscpd.status, 'unavailable')
  assert.match(evidence.optionalAnalyzers.candidate.jscpd.reason, /Capability detection failed/)
})

test('corrupt active state is a lifecycle violation without a reentry loop', () => {
  const root = repository()
  const started = begin(root, { detect: unavailableAnalyzers })
  const state = JSON.parse(fs.readFileSync(started.statePath, 'utf8'))
  state.entry.fingerprint = 'corrupt'
  fs.writeFileSync(started.statePath, JSON.stringify(state))
  assert.equal(hook(root, { stop_hook_active: false }).decision, 'block')
  assert.deepEqual(hook(root, { stop_hook_active: true }), {})
})

test('rejects unbound or noncanonical dirty paths before Stop inspection', () => {
  const scenarios = [
    {
      name: 'unbound full-tree list',
      mutate(state) {
        state.entry.dirtyPaths = state.entry.files.map((file) => file.path).sort()
      }
    },
    {
      name: 'duplicate path',
      mutate(state) {
        state.entry.dirtyPaths = ['src/legacy.js', 'src/legacy.js']
      }
    },
    {
      name: 'traversal path',
      mutate(state) {
        state.entry.dirtyPaths = ['../outside.js']
      }
    }
  ]

  for (const scenario of scenarios) {
    const root = repository()
    const started = begin(root, { detect: unavailableAnalyzers })
    const state = JSON.parse(fs.readFileSync(started.statePath, 'utf8'))
    scenario.mutate(state)
    fs.writeFileSync(started.statePath, JSON.stringify(state))
    const blocked = hook(root, { stop_hook_active: false })
    assert.equal(blocked.decision, 'block', scenario.name)
    assert.match(blocked.reason, /invalid/, scenario.name)
  }
})

test('rejects corrupted entry heads before Stop inspection', () => {
  for (const [name, head] of [
    ['null head', null],
    ['unbound plausible head', '1'.repeat(40)]
  ]) {
    const root = repository()
    const started = begin(root, { detect: unavailableAnalyzers })
    const state = JSON.parse(fs.readFileSync(started.statePath, 'utf8'))
    state.entry.head = head
    fs.writeFileSync(started.statePath, JSON.stringify(state))

    const cleanPath = path.join(root, 'src', 'legacy.js')
    const originalReadFileSync = fs.readFileSync
    let inspected = false
    fs.readFileSync = (target, ...args) => {
      if (typeof target === 'string' && path.resolve(target) === cleanPath) {
        inspected = true
        throw new Error('clean file should not be inspected')
      }
      return originalReadFileSync.call(fs, target, ...args)
    }
    let blocked
    try {
      blocked = hook(root, { stop_hook_active: false })
    } finally {
      fs.readFileSync = originalReadFileSync
    }
    assert.equal(blocked.decision, 'block', name)
    assert.match(blocked.reason, /invalid/, name)
    assert.equal(inspected, false, name)
  }
})

test('Stop hook blocks stale work, does not loop on reentry, and clears fresh state', () => {
  const root = repository()
  const started = begin(root, { detect: unavailableAnalyzers })
  const blocked = hook(root, { stop_hook_active: false })
  assert.equal(blocked.decision, 'block')
  assert.match(blocked.reason, /no check/)
  assert.deepEqual(hook(root, { stop_hook_active: true }), {})
  assert.equal(fs.existsSync(started.statePath), true)

  check(root, { detect: unavailableAnalyzers })
  fs.writeFileSync(path.join(root, 'src', 'new.js'), 'export const changed_after_check = true\n')
  assert.equal(hook(root, { stop_hook_active: false }).decision, 'block')
  assert.deepEqual(hook(root, { stop_hook_active: true }), {})
  assert.equal(fs.existsSync(started.statePath), true)

  check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  assert.equal(fs.existsSync(started.statePath), false)
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
})

test('state files are isolated between linked worktrees', () => {
  const root = repository()
  const worktree = path.join(temporaryRoot(), 'linked')
  git(root, 'worktree', 'add', '-q', '-b', 'quality-linked', worktree)
  const first = begin(root, { detect: unavailableAnalyzers })
  const second = begin(worktree, { detect: unavailableAnalyzers })
  assert.notEqual(first.statePath, second.statePath)
  assert.equal(fs.existsSync(first.statePath), true)
  assert.equal(fs.existsSync(second.statePath), true)
  clear(root)
  clear(worktree)
  git(root, 'worktree', 'remove', '-f', worktree)
})

test('hook is a cheap no-op without an active baseline', () => {
  const root = repository()
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  const result = spawnSync(process.execPath, [
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'quality-delta.mjs'),
    'hook',
    '--root',
    root
  ], { encoding: 'utf8', input: '{}' })
  assert.equal(result.status, 0)
  assert.deepEqual(JSON.parse(result.stdout), {})
})

test('Stop hook does not read unchanged tracked files', () => {
  const root = repository()
  begin(root, { detect: unavailableAnalyzers })
  check(root, { detect: unavailableAnalyzers })
  const cleanPath = path.join(root, 'src', 'legacy.js')
  const originalReadFileSync = fs.readFileSync
  fs.readFileSync = (target, ...args) => {
    if (typeof target === 'string' && path.resolve(target) === cleanPath) {
      throw new Error('unchanged tracked file should not be read by Stop')
    }
    return originalReadFileSync.call(fs, target, ...args)
  }
  try {
    assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  } finally {
    fs.readFileSync = originalReadFileSync
  }
})

test('Stop accepts and clears a fresh check after a committed source change', () => {
  const root = repository()
  const started = begin(root, { detect: unavailableAnalyzers })
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), 'export function legacy() {\n  return 2\n}\n')
  git(root, 'add', 'src/legacy.js')
  git(root, 'commit', '-qm', 'committed source change')

  const evidence = check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(evidence.sourceFiles.changed, ['src/legacy.js'])
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  assert.equal(fs.existsSync(started.statePath), false)
})

test('reports both sides of a committed source rename after begin', () => {
  const root = repository()
  const started = begin(root, { detect: unavailableAnalyzers })
  git(root, 'mv', 'src/legacy.js', 'src/renamed.js')
  git(root, 'commit', '-qm', 'committed source rename')

  const evidence = check(root, { detect: unavailableAnalyzers })
  assert.deepEqual(evidence.sourceFiles.added, ['src/renamed.js'])
  assert.deepEqual(evidence.sourceFiles.changed, [])
  assert.deepEqual(evidence.sourceFiles.deleted, ['src/legacy.js'])
  assert.deepEqual(hook(root, { stop_hook_active: false }), {})
  assert.equal(fs.existsSync(started.statePath), false)
})

test('hook CLI emits exit-0 Stop JSON accepted by Claude Code and Codex', () => {
  const root = repository()
  begin(root, { detect: unavailableAnalyzers })
  const result = spawnSync(process.execPath, [
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'quality-delta.mjs'),
    'hook',
    '--root',
    root
  ], { encoding: 'utf8', input: JSON.stringify({ stop_hook_active: false }) })
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
  const output = JSON.parse(result.stdout)
  assert.equal(output.decision, 'block')
  for (const host of ['Claude Code', 'Codex']) {
    assert.deepEqual(parseStopHookResult(result, host), output,
      `${host} did not parse structured Stop JSON`)
  }

  const legacyError = {
    status: 2,
    stdout: JSON.stringify({ decision: 'block', reason: 'stdout is ignored on exit 2' }),
    stderr: 'continue with the hook reason'
  }
  for (const host of ['Claude Code', 'Codex']) {
    assert.deepEqual(parseStopHookResult(legacyError, host), {
      decision: 'block',
      reason: legacyError.stderr
    }, `${host} did not use stderr for exit 2`)
    assert.throws(() => parseStopHookResult({ ...legacyError, stderr: '' }, host), /rejected/)
  }
})
