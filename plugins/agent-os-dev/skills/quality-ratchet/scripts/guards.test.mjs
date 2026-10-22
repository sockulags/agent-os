import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { editedPaths, globToRegExp, hook, isGitCommit, lockTest, scanSecrets, sessionContext } from './guards.mjs'
import { begin, clear } from './quality-delta.mjs'

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

function repository(guards = { schema: 1, protectedPaths: ['migrations/**'], secretScan: true }) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-guards-')))
  git(root, 'init', '-q', '-b', '2026-11-csv-export-U1')
  git(root, 'config', 'user.email', 'test@example.invalid')
  git(root, 'config', 'user.name', 'Test')
  const write = (relative, content) => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
    fs.writeFileSync(path.join(root, relative), content)
  }
  if (guards) write('.agent-os/guards.json', JSON.stringify(guards))
  write('intents/2026-11-csv-export/intent.md', '---\nid: 2026-11-csv-export\nstatus: accepted\nrev: 2\nsupersedes: null\n---\n# Export\n')
  write('intents/2026-11-csv-export/spec.md', '---\nintent: 2026-11-csv-export\nrev: 1\nbuilt_on: intent@1\nstatus: accepted\n---\n# Export\n')
  write('intents/2026-11-csv-export/plan.md', '---\nintent: 2026-11-csv-export\nrev: 1\nbuilt_on: spec@1\nstatus: accepted\nsource: files\n---\n## Units\n\n- [U1] Export endpoint\n\n### U1 Export endpoint\n')
  write('tests/export.test.js', 'test("x", () => {})\n')
  write('src/app.js', 'export const x = 1\n')
  git(root, 'add', '-A')
  git(root, 'commit', '-qm', 'init')
  return { root, write }
}

const edit = (root, file, extra = {}) => ({
  hook_event_name: 'PreToolUse', cwd: root, session_id: 'guards-test', tool_name: 'Edit', tool_input: { file_path: path.join(root, file) }, ...extra
})

test('glob matching follows segments', () => {
  assert.ok(globToRegExp('migrations/**').test('migrations/2026/001.sql'))
  assert.ok(globToRegExp('intents/*/spec.md').test('intents/2026-11-a/spec.md'))
  assert.ok(!globToRegExp('intents/*/spec.md').test('intents/a/b/spec.md'))
  assert.ok(globToRegExp('**/*.lock').test('a/b/c.lock'))
})

test('edited paths come from Claude tool input and Codex patches', () => {
  assert.deepEqual(editedPaths({ tool_input: { file_path: 'a.js' } }), ['a.js'])
  const patch = '*** Begin Patch\n*** Update File: src/a.js\n@@\n*** Add File: src/b.js\n*** End Patch'
  assert.deepEqual(editedPaths({ tool_input: { command: ['apply_patch', patch] } }), ['src/a.js', 'src/b.js'])
  assert.ok(isGitCommit({ tool_input: { command: 'git add -A && git commit -m "x"' } }))
  assert.ok(isGitCommit({ tool_input: { command: 'git -C repo commit -m x' } }))
  assert.ok(!isGitCommit({ tool_input: { command: 'git log --grep commit' } }))
})

test('secret scan reports added secrets with location and skips placeholders', () => {
  const diff = [
    '+++ b/src/config.js',
    '@@ -0,0 +1,3 @@',
    '+const ok = 1',
    "+const apiKey = 'AKIAABCDEFGHIJKLMNOP'",
    "+const password = '<your-password-here>'"
  ].join('\n')
  assert.deepEqual(scanSecrets(diff), [{ file: 'src/config.js', line: 2, label: 'AWS access key' }])
})

test('hooks do nothing without guards.json', () => {
  const { root } = repository(null)
  assert.equal(hook(root, edit(root, 'migrations/001.sql')).exitCode, 0)
})

test('protected paths ask on Claude and block on Codex', () => {
  const { root } = repository()
  const claude = hook(root, edit(root, 'migrations/001.sql'))
  assert.equal(claude.exitCode, 0)
  assert.equal(JSON.parse(claude.stdout).hookSpecificOutput.permissionDecision, 'ask')
  const codex = hook(root, edit(root, 'migrations/001.sql', { turn_id: 't1' }))
  assert.equal(codex.exitCode, 2)
  assert.equal(hook(root, edit(root, 'src/app.js')).exitCode, 0)
})

test('accepted intents and specs are frozen only during delivery', () => {
  const { root } = repository()
  const payload = edit(root, 'intents/2026-11-csv-export/spec.md')
  assert.equal(hook(root, payload).exitCode, 0)
  const env = { ...process.env, CODEX_THREAD_ID: '', CLAUDE_CODE_SESSION_ID: 'guards-test' }
  begin(root, { env, detect: () => ({}) })
  try {
    const result = hook(root, payload, { env })
    assert.equal(result.exitCode, 2)
    assert.match(result.stderr, /delivery never edits it/)
  } finally {
    clear(root, { env })
  }
})

test('a locked test blocks edits until unlocked', () => {
  const { root } = repository()
  lockTest(root, 'tests/export.test.js', { cwd: root })
  const result = hook(root, edit(root, 'tests/export.test.js'))
  assert.equal(result.exitCode, 2)
  assert.match(result.stderr, /locked failing test/)
  lockTest(root, 'tests/export.test.js', { lock: false, cwd: root })
  assert.equal(hook(root, edit(root, 'tests/export.test.js')).exitCode, 0)
})

test('a commit that stages a secret is blocked', () => {
  const { root, write } = repository()
  write('src/config.js', "export const token = 'ghp_" + 'a'.repeat(36) + "'\n")
  git(root, 'add', 'src/config.js')
  const result = hook(root, { hook_event_name: 'PreToolUse', cwd: root, tool_name: 'Bash', tool_input: { command: 'git commit -m "add config"' } })
  assert.equal(result.exitCode, 2)
  assert.match(result.stderr, /src\/config\.js:1 \(GitHub token\)/)
})

test('session context names the branch intent, stale files, and locks', () => {
  const { root } = repository()
  const context = sessionContext(root)
  assert.match(context, /intent 2026-11-csv-export, unit U1 "Export endpoint" \(spec rev 1\)/)
  assert.match(context, /Stale: intents\/2026-11-csv-export\/spec\.md is built on intent@1, but intent\.md is at rev 2/)
  const result = hook(root, { hook_event_name: 'SessionStart', cwd: root })
  assert.equal(result.stdout, context)
})

test('a command that stages and commits in one go is scanned before git add runs', () => {
  const { root, write } = repository()
  write('src/keys.js', "export const key = 'AKIAABCDEFGHIJKLMNOP'\n")
  const result = hook(root, { hook_event_name: 'PreToolUse', cwd: root, tool_name: 'Bash', tool_input: { command: 'git add src/keys.js && git commit -m "keys"' } })
  assert.equal(result.exitCode, 2)
  assert.match(result.stderr, /src\/keys\.js:1 \(AWS access key\)/)
})

test('a malformed guards.json blocks edits except the one that repairs it', () => {
  const { root, write } = repository()
  write('.agent-os/guards.json', '{ broken')
  assert.equal(hook(root, edit(root, 'src/app.js')).exitCode, 2)
  assert.equal(hook(root, edit(root, '.agent-os/guards.json')).exitCode, 0)
})
