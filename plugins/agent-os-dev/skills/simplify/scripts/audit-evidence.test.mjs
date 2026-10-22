import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { collectEvidence, formatEvidence, summarizeJscpd } from './audit-evidence.mjs'

// Every external tool is reported missing; git still runs.
function withoutTools(command, args, options) {
  if (['where.exe', 'which'].includes(command)) return { status: 1, stdout: '', stderr: '' }
  return spawnSync(command, args, options)
}

test('ranks complex functions and reports missing tools as unavailable', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-audit-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  execFileSync('git', ['init', '-q', root])
  fs.writeFileSync(path.join(root, 'a.js'), 'export const a = 1\n')
  fs.writeFileSync(path.join(root, 'b.py'), 'b = 1\n')
  fs.writeFileSync(path.join(root, 'notes.md'), '# not source\n')
  const analyze = (cwd, files) => files.map((file, index) => ({ file, function: `f${index}`, line: 1, ccn: index + 5, nloc: 1 }))

  const evidence = collectEvidence(root, { spawn: withoutTools, analyze })
  assert.equal(evidence.sourceFiles, 2)
  assert.deepEqual(evidence.complexity.functions.map((fn) => [fn.file, fn.ccn]), [['b.py', 6], ['a.js', 5]])
  assert.equal(evidence.duplication.status, 'unavailable')
  assert.deepEqual(evidence.deadCode.map((section) => [section.tool, section.status]), [
    ['knip', 'unavailable'],
    ['vulture', 'unavailable']
  ])
  const text = formatEvidence(evidence)
  assert.match(text, /6 {2}b\.py:1 f1/)
  assert.match(text, /These are candidates/)
})

test('summarizes jscpd clones largest first with forward-slash paths', () => {
  const clone = (lines, first, second) => ({
    lines,
    firstFile: { name: first, start: 1, end: lines },
    secondFile: { name: second, start: 10, end: 9 + lines }
  })
  const summary = summarizeJscpd({
    statistics: { total: { percentage: 4.2 } },
    duplicates: [clone(5, 'src\\a.js', 'src\\b.js'), clone(30, 'src/c.js', 'src/d.js')]
  })
  assert.equal(summary.percentage, 4.2)
  assert.deepEqual(summary.clones.map((entry) => [entry.lines, entry.first]), [[30, 'src/c.js:1-30'], [5, 'src/a.js:1-5']])
})
