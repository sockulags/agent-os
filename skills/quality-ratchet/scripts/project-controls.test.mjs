import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { begin, check, hook, clear } from './quality-delta.mjs'

const options = { detect: () => ({}) }
function fixture(t, checks = [], extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-controls-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  execFileSync('git', ['init', '-q', root])
  fs.mkdirSync(path.join(root, '.agent-os'))
  const write = (name, content) => fs.writeFileSync(path.join(root, name), content)
  write('.agent-os/quality.json', JSON.stringify({ schema: 1, checks, ...extra }))
  write('.gitignore', 'counter\ntools/\n')
  fs.mkdirSync(path.join(root, 'tools'))
  write('tools/version', '1')
  write('source.ts', 'export const value = 1\n')
  write('verify.cjs', "const fs = require('fs'); fs.appendFileSync('counter', 'x'); if (fs.readFileSync('source.ts', 'utf8').includes('BROKEN')) process.exit(1)")
  return { root, write, policy: JSON.parse(fs.readFileSync(path.join(root, '.agent-os/quality.json'))), count: () => fs.readFileSync(path.join(root, 'counter'), 'utf8').length }
}
const required = { id: 'verify', command: ['node', 'verify.cjs'], required: true }
const cached = { ...required, cache: { kind: 'static', toolInputs: ['tools'] } }

test('required failures block repeatedly; fixed code passes and Stop never reruns commands', t => {
  const f = fixture(t, [required])
  const started = begin(f.root, options)
  f.write('source.ts', 'BROKEN')
  assert.equal(check(f.root, options).status, 'blocked')
  assert.equal(hook(f.root).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  assert.equal(f.count(), 1)
  f.write('source.ts', 'export const value = 2')
  assert.equal(check(f.root, options).status, 'ok')
  assert.deepEqual(hook(f.root), {})
  assert.equal(f.count(), 2)
  assert.ok(fs.existsSync(started.statePath + '.report.json'))
})

test('advisory failures and new exception signals do not gate delivery', t => {
  const f = fixture(t, [{ ...required, required: false }])
  f.write('source.ts', '// @ts-ignore\nexport const value = 1')
  begin(f.root, options)
  f.write('source.ts', '// @ts-ignore\n// eslint-disable-next-line\nconst value: any = "BROKEN"')
  const result = check(f.root, options)
  assert.equal(result.status, 'ok')
  assert.equal(result.controls.results[0].status, 'failed')
  assert.deepEqual(result.controls.signals.map(s => s.rule), ['lint-disable', 'type-escape'])
  assert.deepEqual(hook(f.root), {})
})

test('an explicit project exception rule blocks only additions since entry', t => {
  const f = fixture(t, [], { blockSignals: ['test-skip'] })
  f.write('source.ts', "test.skip('old', () => {})")
  begin(f.root, options)
  f.write('source.ts', "\n\ntest.skip('old', () => {})\ntest.skip('new', () => {})")
  const result = check(f.root, options)
  assert.equal(result.status, 'blocked')
  assert.equal(result.controls.signals.length, 1)
  assert.match(hook(f.root).reason, /source.ts:4 test-skip/)
})

test('static cache invalidates on source, ignored tool inputs, and environment; Stop checks freshness', t => {
  const f = fixture(t, [cached])
  const env = { ...process.env, CONTROL_FIXTURE: 'one' }
  begin(f.root, { ...options, env })
  assert.equal(check(f.root, { ...options, env }).controls.results[0].cached, false)
  assert.equal(check(f.root, { ...options, env }).controls.results[0].cached, true)
  assert.equal(f.count(), 1)
  f.write('tools/version', '2')
  assert.equal(hook(f.root, {}, { env }).decision, 'block')
  assert.equal(check(f.root, { ...options, env }).controls.results[0].cached, false)
  env.CONTROL_FIXTURE = 'two'
  assert.equal(hook(f.root, {}, { env }).decision, 'block')
  assert.equal(check(f.root, { ...options, env }).controls.results[0].cached, false)
  f.write('source.ts', 'export const value = 3')
  assert.equal(check(f.root, { ...options, env }).controls.results[0].cached, false)
  assert.equal(f.count(), 4)
})

test('dynamic checks and failed static checks are never reused', t => {
  for (const control of [required, cached]) {
    const f = fixture(t, [control])
    begin(f.root, options)
    if (control.cache) f.write('source.ts', 'BROKEN')
    check(f.root, options)
    assert.equal(check(f.root, options).controls.results[0].cached, false)
    assert.equal(f.count(), 2)
  }
})

test('policy changes require explicit acknowledgement and cannot be cleared silently', t => {
  const f = fixture(t, [required], { protectedFiles: ['verify.cjs'] })
  begin(f.root, options)
  f.write('verify.cjs', 'process.exit(0)')
  assert.equal(check(f.root, options).status, 'blocked')
  assert.throws(() => clear(f.root), /Policy changed|policy changed/)
  assert.equal(hook(f.root).decision, 'block')
  const accepted = check(f.root, { ...options, acceptPolicyChange: 'Authorized replacement of obsolete check' })
  assert.equal(accepted.status, 'ok')
  assert.match(accepted.controls.policyAcknowledgement.reason, /Authorized/)
  assert.match(check(f.root, options).controls.policyAcknowledgement.reason, /Authorized/)
  assert.deepEqual(hook(f.root), {})
})

test('missing executable, missing tool inputs, timeout, and malformed policy cannot report success', t => {
  const controls = [
    { ...required, command: ['agent-os-nonexistent-fixture-command'] },
    { ...cached, cache: { kind: 'static', toolInputs: ['missing'] } },
    { ...required, command: ['node', '-e', 'setInterval(() => {}, 1000)'], timeoutMs: 20 }
  ]
  for (const control of controls) {
    const f = fixture(t, [control])
    begin(f.root, options)
    assert.equal(check(f.root, options).status, 'blocked')
    assert.equal(hook(f.root).decision, 'block')
  }
  const f = fixture(t)
  begin(f.root, options)
  f.write('.agent-os/quality.json', '{')
  assert.throws(() => check(f.root, options))
  assert.equal(hook(f.root).decision, 'block')
})

test('commands that mutate source leave stale evidence', t => {
  const f = fixture(t, [{ ...required, command: ['node', '-e', "require('fs').appendFileSync('source.ts', '\\n// generated')"] }])
  begin(f.root, options)
  assert.equal(check(f.root, options).controls.stale, true)
  assert.equal(hook(f.root).decision, 'block')
})

test('cache rejects symlink ancestors and repository symlinks', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t, [{ ...cached, cache: { kind: 'static', toolInputs: ['tools/link/version'] } }])
  fs.symlinkSync('.', path.join(f.root, 'tools/link'))
  begin(f.root, options)
  assert.match(check(f.root, options).controls.results[0].detail, /Symlink/)
  const other = fixture(t, [cached])
  fs.symlinkSync('source.ts', path.join(other.root, 'linked.ts'))
  begin(other.root, options)
  assert.match(check(other.root, options).controls.results[0].detail, /symlinks/)
})

test('host payload identity and another session cannot consume verified controls', t => {
  const f = fixture(t, [required])
  const env = { ...process.env, CODEX_THREAD_ID: 'controls-a', CLAUDE_CODE_SESSION_ID: '' }
  begin(f.root, { ...options, env })
  check(f.root, { ...options, env })
  assert.deepEqual(hook(f.root, { session_id: 'controls-b', turn_id: 'turn' }, { env }), {})
  assert.deepEqual(hook(f.root, { session_id: 'controls-a', turn_id: 'turn' }, { env }), {})
  assert.equal(f.count(), 1)
})

test('focused tests are new exceptions under an explicit test-skip rule', t => {
  const f = fixture(t, [], { blockSignals: ['test-skip'] })
  begin(f.root, options)
  f.write('source.ts', "test.only('focus', () => {})\ndescribe.only('suite', () => {})")
  const result = check(f.root, options)
  assert.equal(result.status, 'blocked')
  assert.equal(result.controls.signals.length, 2)
})

test('external executable permission changes invalidate a cached pass', { skip: process.platform === 'win32' }, t => {
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-tool-'))
  t.after(() => fs.rmSync(external, { recursive: true, force: true }))
  const tool = path.join(external, 'verify')
  fs.writeFileSync(tool, '#!/bin/sh\nexit 0\n', { mode: 0o755 })
  const f = fixture(t, [{ ...cached, command: [tool] }])
  begin(f.root, options)
  assert.equal(check(f.root, options).status, 'ok')
  fs.chmodSync(tool, 0o644)
  assert.equal(hook(f.root).decision, 'block')
  assert.equal(check(f.root, options).status, 'blocked')
})
