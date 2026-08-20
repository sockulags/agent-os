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

function repository() {
  const root = temporaryRoot()
  git(root, 'init', '-q')
  git(root, 'config', 'user.email', 'quality@example.invalid')
  git(root, 'config', 'user.name', 'Quality Test')
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

test('hook CLI emits Stop JSON and exit 2 for the first lifecycle violation', () => {
  const root = repository()
  begin(root, { detect: unavailableAnalyzers })
  const result = spawnSync(process.execPath, [
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'quality-delta.mjs'),
    'hook',
    '--root',
    root
  ], { encoding: 'utf8', input: JSON.stringify({ stop_hook_active: false }) })
  assert.equal(result.status, 2)
  assert.deepEqual(JSON.parse(result.stdout).decision, 'block')
})
