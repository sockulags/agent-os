import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { lintIntents, parseFrontmatter, parseUnits } from './intent-files.mjs'

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
}

const intent = (rev = 1, body = '# Export\n') =>
  `---\nid: 2026-11-csv-export\nstatus: accepted\nrev: ${rev}\nsupersedes: null\n---\n${body}`
const spec = (builtOn = 1, rev = 1) =>
  `---\nintent: 2026-11-csv-export\nrev: ${rev}\nbuilt_on: intent@${builtOn}\nstatus: accepted\n---\n# Export\n`
const plan = (units, sections = '') =>
  `---\nintent: 2026-11-csv-export\nrev: 1\nbuilt_on: spec@1\nstatus: accepted\nsource: files\n---\n## Units\n\n${units}\n\n${sections}`

function repository(files) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-intents-')))
  for (const [relative, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
    fs.writeFileSync(path.join(root, relative), content)
  }
  return root
}

const messages = (problems, level) => problems.filter((item) => item.level === level).map((item) => `${item.file}: ${item.message}`)

test('frontmatter and unit lines parse into plain values', () => {
  assert.deepEqual(parseFrontmatter('---\nid: a\nrev: "2"\n---\nbody').data, { id: 'a', rev: '2' })
  assert.equal(parseFrontmatter('no frontmatter'), null)
  assert.deepEqual(parseUnits('## Units\n- [WEB-142] Export endpoint\n- [U2] Button — depends on WEB-142, U1 — blocked: copy text\n## Next'), [
    { key: 'WEB-142', title: 'Export endpoint', depends: [], blocked: null },
    { key: 'U2', title: 'Button', depends: ['WEB-142', 'U1'], blocked: 'copy text' }
  ])
})

test('a consistent intent folder passes', () => {
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint\n- [U2] Button — depends on U1', '### U1 Endpoint\n\n### U2 Button\n')
  })
  assert.deepEqual(lintIntents(root), [])
})

test('broken files are reported as errors and stale specs as warnings', () => {
  const root = repository({
    'intents/Bad_Name/intent.md': intent(),
    'intents/2026-11-csv-export/intent.md': intent(2),
    'intents/2026-11-csv-export/spec.md': spec(1),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint — depends on U9\n- [U1] Again')
  })
  const errors = messages(lintIntents(root), 'error')
  assert.ok(errors.some((line) => line.startsWith('intents/Bad_Name: folder name')))
  assert.ok(errors.includes('intents/2026-11-csv-export/plan.md: unit key U1 appears twice'))
  assert.ok(errors.includes('intents/2026-11-csv-export/plan.md: unit U1 depends on unknown unit U9'))
  assert.deepEqual(messages(lintIntents(root), 'warning'), [
    'intents/2026-11-csv-export/spec.md: stale: built on intent@1, but intent.md is at rev 2'
  ])
})

test('changing an accepted text needs a higher rev unless explicitly allowed', () => {
  const root = repository({ 'intents/2026-11-csv-export/intent.md': intent(1) })
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.email', 'test@example.invalid')
  git(root, 'config', 'user.name', 'Test')
  git(root, 'add', '-A')
  git(root, 'commit', '-qm', 'base')
  git(root, 'checkout', '-qb', 'change')
  fs.writeFileSync(path.join(root, 'intents/2026-11-csv-export/intent.md'), intent(1, '# Export with Excel\n'))
  git(root, 'commit', '-qam', 'change')
  assert.match(messages(lintIntents(root, { base: 'main' }), 'error').join('\n'), /changed without raising rev 1/)
  assert.deepEqual(messages(lintIntents(root, { base: 'main', allowUnchangedRev: true }), 'error'), [])
  fs.writeFileSync(path.join(root, 'intents/2026-11-csv-export/intent.md'), intent(2, '# Export with Excel\n'))
  git(root, 'commit', '-qam', 'raise rev')
  assert.deepEqual(messages(lintIntents(root, { base: 'main' }), 'error'), [])
})
