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
const spec = (builtOn = 1, rev = 1, face = '## Interface\n\nNone\n') =>
  `---\nintent: 2026-11-csv-export\nrev: ${rev}\nbuilt_on: intent@${builtOn}\nstatus: accepted\n---\n# Export\n\n${face}`
const plan = (units, sections = '') =>
  `---\nintent: 2026-11-csv-export\nrev: 1\nbuilt_on: spec@1\nstatus: accepted\nsource: files\n---\n## Units\n\n${units}\n\n${sections}`

const contract = (heading, acceptance = '- Given a filter, when exported, then the CSV holds the filtered rows (spec example 1).') =>
  `### ${heading}\n\nOutcome: x\nBoundaries: x\nChange surface: x\nAcceptance:\n${acceptance}\nGround truth: x\nDependencies: none\n` +
  'Evidence and settled decisions: none\nDelivery target: pull request\nOpen risks: none\n\n'

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
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint\n- [U2] Button — depends on U1', contract('U1 Endpoint') + contract('U2 Button'))
  })
  assert.deepEqual(lintIntents(root), [])
})

test('a ready unit with a missing field or a bare acceptance pointer is a warning, not an error', () => {
  const thin = contract('U1 Endpoint', 'behaviors 14 to 17, 20, 23 (server side).').replace('Change surface: x\n', '')
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint', thin)
  })
  assert.deepEqual(messages(lintIntents(root), 'error'), [])
  assert.deepEqual(messages(lintIntents(root), 'warning'), [
    'intents/2026-11-csv-export/plan.md: unit U1 has no "Change surface:" field',
    'intents/2026-11-csv-export/plan.md: unit U1 acceptance only points at the spec; write out the checks'
  ])
})

const interfaceWarnings = (face, extra = {}) => {
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(1, 1, face),
    ...extra
  })
  assert.deepEqual(messages(lintIntents(root), 'error'), [])
  return messages(lintIntents(root), 'warning').map((line) => line.replace('intents/2026-11-csv-export/spec.md: ', ''))
}

test('a spec with decided surfaces and reachable sketches has no interface warnings', () => {
  const face = '## Interface\n\n' +
    '- Accountant, invoice list. Decided: export sits in the header, because they look there.\n' +
    '  Rejected: filter bar. Sketch: `intents/2026-11-csv-export/sketches/list.html`.\n' +
    '- Admin, settings. Deferred to Mira by 2026-12-01: where the limit is shown.\n' +
    '- Accountant, empty list. Decided: no action. Sketch: [image](https://github.com/o/r/pull/1).\n\n## Boundaries\n'
  assert.deepEqual(interfaceWarnings(face, { 'intents/2026-11-csv-export/sketches/list.html': 'x' }), [])
})

test('a surface left to delivery needs no sketch and no warning', () => {
  const face = '## Interface\n\n- Admin, settings. Left to delivery: the layout, inside the existing settings page.\n\n## Boundaries\n'
  assert.deepEqual(interfaceWarnings(face), [])
})

test('a missing or empty interface section is a warning, and None is enough', () => {
  assert.deepEqual(interfaceWarnings(''), ['needs a "## Interface" section; write None when nothing a person sees or does changes'])
  assert.deepEqual(interfaceWarnings('## Interface\n\n## Boundaries\n'), ['"## Interface" is empty; list each surface or write None'])
  assert.deepEqual(interfaceWarnings('## Interface\n\nNone.\n'), [])
})

test('a surface without a decision or an owner is a warning', () => {
  const warnings = interfaceWarnings('## Interface\n\n- Admin, settings. Open: where it goes.\n- Admin, list. Deferred to Mira: order.\n- Admin, page. Looks nice.\n')
  assert.deepEqual(warnings, [
    'interface surface "Admin, settings. Open: where it goes." is still open',
    'interface surface "Admin, list. Deferred to Mira: order." is deferred without an owner and a date',
    'interface surface "Admin, page. Looks nice." has no Decided:, Left to delivery:, Deferred to, or Open:'
  ])
})

test('a sketch must exist and be reachable by others', () => {
  const warnings = interfaceWarnings('## Interface\n\n- A, B. Decided: x. Sketch: `gone.png`, `../outbox/a.png`, `C:/Users/me/a.png`, `Sketches/Export/Header`.\n')
  assert.deepEqual(warnings, [
    'interface names gone.png, which does not exist',
    'interface names ../outbox/a.png, which exists only on one machine; use a repository path, a pull request image, or a URL',
    'interface names C:/Users/me/a.png, which exists only on one machine; use a repository path, a pull request image, or a URL'
  ])
})

test('a field label may carry a parenthetical qualifier', () => {
  const qualified = contract('U1 Endpoint').replace('Acceptance:', 'Acceptance (all with the mock server):')
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint', qualified)
  })
  assert.deepEqual(lintIntents(root), [])
})

test('an overlong unit is a warning that names its length', () => {
  const longCheck = `- Given a filter, when exported, then the CSV holds the filtered rows (spec example 1). ${'x'.repeat(5000)}`
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint', contract('U1 Endpoint', longCheck))
  })
  assert.deepEqual(messages(lintIntents(root), 'error'), [])
  assert.match(messages(lintIntents(root), 'warning').join('\n'), /unit U1 contract is \d+ characters; cut what retells the spec or split it/)
})

test('a blocked unit is not held to the ready contract', () => {
  const root = repository({
    'intents/2026-11-csv-export/intent.md': intent(),
    'intents/2026-11-csv-export/spec.md': spec(),
    'intents/2026-11-csv-export/plan.md': plan('- [U1] Endpoint — blocked: which format', '### U1 Endpoint\n\nOutcome: x\n')
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
