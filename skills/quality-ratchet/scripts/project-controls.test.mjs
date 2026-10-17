import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import test, { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import { begin, check, finish, hook, clear, controlsTrustPlan, trustControls } from './quality-delta.mjs'

const trustRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-trust-'))
after(() => fs.rmSync(trustRoot, { recursive: true, force: true }))
const trustStore = path.join(trustRoot, 'trusted-controls.json')
const options = { detect: () => ({}), trustStore }
// CI=true trusts every control, so trust tests run as a developer machine.
const developerEnv = { ...process.env, CI: '' }
const trust = root => trustControls(controlsTrustPlan(root), { trustStore })
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
  trust(root)
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

test('an unfixable required failure releases Stop to the user after the bounded limit', t => {
  const f = fixture(t, [required])
  begin(f.root, options)
  f.write('source.ts', 'BROKEN')
  assert.equal(check(f.root, options).status, 'blocked')
  assert.equal(hook(f.root, { stop_hook_active: false }).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  const released = hook(f.root, { stop_hook_active: true })
  assert.equal(released.decision, undefined)
  assert.match(released.systemMessage, /verify: failed/)
  assert.equal(hook(f.root, { stop_hook_active: false }).decision, undefined)

  f.write('source.ts', 'BROKEN again')
  assert.equal(check(f.root, options).status, 'blocked')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  f.write('source.ts', 'export const value = 3')
  assert.equal(check(f.root, options).status, 'ok')
  assert.deepEqual(hook(f.root), {})
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

test('finish keeps the baseline while a required control fails and closes it once it passes', t => {
  const f = fixture(t, [required])
  const started = begin(f.root, options)
  f.write('source.ts', 'BROKEN')
  const refused = finish(f.root, options)
  assert.equal(refused.closed, false)
  assert.equal(refused.evidence.status, 'blocked')
  assert.equal(fs.existsSync(started.statePath), true)
  f.write('source.ts', 'export const value = 4')
  assert.equal(finish(f.root, options).closed, true)
  assert.equal(fs.existsSync(started.statePath), false)
})

test('policy changes require explicit acknowledgement and cannot be cleared silently', t => {
  const f = fixture(t, [required], { protectedFiles: ['verify.cjs'] })
  begin(f.root, options)
  f.write('verify.cjs', 'process.exit(0)')
  assert.equal(check(f.root, options).status, 'blocked')
  assert.throws(() => clear(f.root), /Policy changed|policy changed/)
  assert.equal(hook(f.root).decision, 'block')
  const accepted = check(f.root, { ...options, env: developerEnv, acceptPolicyChange: 'Authorized replacement of obsolete check' })
  assert.match(accepted.controls.policyAcknowledgement.reason, /Authorized/)
  // The acknowledged policy is a new signature, so its commands need the developer's trust again.
  assert.equal(accepted.status, 'blocked')
  assert.ok(accepted.controls.untrusted)
  trust(f.root)
  const trusted = check(f.root, { ...options, env: developerEnv })
  assert.equal(trusted.status, 'ok')
  assert.match(trusted.controls.policyAcknowledgement.reason, /Authorized/)
  assert.deepEqual(hook(f.root, {}, { env: developerEnv }), {})
})

test('untrusted repository commands never run and block delivery until the developer trusts them', t => {
  const f = fixture(t, [required])
  const untrustedStore = path.join(trustRoot, `untrusted-${Date.now()}.json`)
  const untrusted = { ...options, env: developerEnv, trustStore: untrustedStore }
  const started = begin(f.root, untrusted)
  const evidence = check(f.root, untrusted)
  assert.equal(evidence.status, 'blocked')
  assert.deepEqual(evidence.controls.results, [])
  assert.deepEqual(evidence.controls.untrusted.commands, [{ id: 'verify', command: ['node', 'verify.cjs'] }])
  assert.match(evidence.controls.untrusted.trustCommand, / trust$/)
  assert.equal(fs.existsSync(path.join(f.root, 'counter')), false)
  assert.equal(finish(f.root, untrusted).closed, false)
  assert.match(hook(f.root, {}, { env: developerEnv }).reason, /not trusted on this machine/)

  trustControls(controlsTrustPlan(f.root), { trustStore: untrustedStore })
  assert.equal(finish(f.root, untrusted).closed, true)
  assert.equal(f.count(), 1)
  assert.equal(fs.existsSync(started.statePath), false)
})

test('a CI environment runs declared controls without a trust record', t => {
  const f = fixture(t, [required])
  const env = { ...process.env, CI: 'true' }
  const untrusted = { ...options, env, trustStore: path.join(trustRoot, `ci-${Date.now()}.json`) }
  begin(f.root, untrusted)
  const evidence = check(f.root, untrusted)
  assert.equal(evidence.status, 'ok')
  assert.equal(evidence.controls.untrusted, null)
  assert.equal(f.count(), 1)
})

test('trust is shared by linked worktrees of the same repository', t => {
  const f = fixture(t, [required])
  execFileSync('git', ['-C', f.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '.'])
  execFileSync('git', ['-C', f.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'fixture'])
  const linked = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-controls-linked-'))
  fs.rmSync(linked, { recursive: true })
  t.after(() => fs.rmSync(linked, { recursive: true, force: true }))
  execFileSync('git', ['-C', f.root, 'worktree', 'add', '-q', '-b', 'linked', linked])
  assert.equal(controlsTrustPlan(linked).repository, controlsTrustPlan(f.root).repository)
})

test('the trust command refuses to record trust without an interactive terminal', t => {
  const f = fixture(t, [required])
  const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'quality-delta.mjs')
  const result = spawnSync(process.execPath, [runner, 'trust', '--root', f.root], { encoding: 'utf8', input: 'y\n' })
  assert.equal(result.status, 2)
  assert.match(result.stdout, /verify \(required\): \["node","verify.cjs"\]/)
  assert.match(result.stderr, /interactive terminal/)
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

test('stale control evidence is bounded at Stop', t => {
  const f = fixture(t, [required])
  begin(f.root, options)
  assert.equal(check(f.root, options).status, 'ok')
  const env = { ...process.env, CONTROL_FIXTURE: 'changed after check' }
  assert.match(hook(f.root, { stop_hook_active: false }, { env }).reason, /control evidence is stale/)
  assert.equal(hook(f.root, { stop_hook_active: true }, { env }).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }, { env }).decision, 'block')
  assert.match(hook(f.root, { stop_hook_active: true }, { env }).systemMessage, /still stale/)
})

test('a released stale-check block does not use up the failing-controls budget', t => {
  const f = fixture(t, [required])
  begin(f.root, options)
  f.write('source.ts', 'BROKEN')
  assert.equal(hook(f.root, { stop_hook_active: false }).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  assert.equal(hook(f.root, { stop_hook_active: true }).decision, 'block')
  assert.match(hook(f.root, { stop_hook_active: true }).systemMessage, /has not run/)
  assert.equal(check(f.root, options).status, 'blocked')
  assert.match(hook(f.root, { stop_hook_active: false }).reason, /Project controls block delivery/)
})
