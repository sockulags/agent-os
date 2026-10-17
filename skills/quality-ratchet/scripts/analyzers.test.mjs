import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { complexityDelta, findLizard, lizardFunctions, parseLizardCsv } from './analyzers.mjs'
import { begin, check, hook } from './quality-delta.mjs'

const options = { detect: () => ({}) }

// Deterministic stand-in for lizard: one function per file, complexity 1 + number of `if`.
function fakeAnalyzer(cwd, files) {
  return files.map((file) => ({
    file,
    function: 'main',
    line: 1,
    ccn: 1 + (fs.readFileSync(path.join(cwd, file), 'utf8').match(/\bif\b/g) || []).length,
    nloc: 1
  }))
}

function repository(t, policy) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-analyzers-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  git('init', '-q')
  git('config', 'user.email', 'analyzers@example.invalid')
  git('config', 'user.name', 'Analyzer Test')
  fs.mkdirSync(path.join(root, 'src'))
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), 'export function main(a) {\n  return a\n}\n')
  if (policy) {
    fs.mkdirSync(path.join(root, '.agent-os'))
    fs.writeFileSync(path.join(root, '.agent-os', 'quality.json'), JSON.stringify({ schema: 1, checks: [], ...policy }))
  }
  git('add', '.')
  git('commit', '-qm', 'fixture')
  return root
}

const ifs = (count) => `export function main(a) {\n${'  if (a) a++\n'.repeat(count)}  return a\n}\n`

test('parses lizard CSV including quoted long names with commas', () => {
  const functions = parseLizardCsv([
    '6,2,17,2,6,"one@1-6@src/e.js","src/e.js","one","one ( a , b )",1,6',
    '9,6,36,2,9,"branchy@1-9@src\\d.py","src\\d.py","branchy","branchy( a , b )",1,9',
    'not,a,row'
  ].join('\r\n'))
  assert.deepEqual(functions, [
    { file: 'src/e.js', function: 'one', line: 1, ccn: 2, nloc: 6 },
    { file: 'src/d.py', function: 'branchy', line: 1, ccn: 6, nloc: 9 }
  ])
})

test('complexity delta ranks increased and new functions and counts reductions', () => {
  const fn = (file, name, ccn) => ({ file, function: name, line: 1, ccn, nloc: 1 })
  const delta = complexityDelta(
    [fn('a.js', 'same', 3), fn('a.js', 'grew', 2), fn('a.js', 'shrank', 9), fn('a.js', 'gone', 4)],
    [fn('a.js', 'same', 3), fn('a.js', 'grew', 7), fn('a.js', 'shrank', 5), fn('a.js', 'fresh', 12), fn('a.js', 'trivial', 1)]
  )
  assert.deepEqual(delta.functions.map((row) => [row.function, row.before, row.after]), [
    ['fresh', null, 12],
    ['grew', 2, 7]
  ])
  assert.equal(delta.increased, 1)
  assert.equal(delta.added, 2)
  assert.equal(delta.decreased, 2)
  assert.equal(delta.maxAfter, 12)
})

test('check reports complexity deltas against clean entry content', (t) => {
  const root = repository(t)
  begin(root, options)
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), ifs(3))
  fs.writeFileSync(path.join(root, 'src', 'new.js'), ifs(5))
  const evidence = check(root, { ...options, analyzeComplexity: fakeAnalyzer })
  assert.equal(evidence.complexity.status, 'available')
  assert.deepEqual(evidence.complexity.functions.map((row) => [row.path, row.before, row.after]), [
    ['src/new.js', null, 6],
    ['src/legacy.js', 1, 4]
  ])
  assert.deepEqual(evidence.complexity.beforeUnavailable, [])
  assert.equal(evidence.status, 'ok')
})

test('a file dirty at begin has no recoverable before state', (t) => {
  const root = repository(t)
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), ifs(1))
  begin(root, options)
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), ifs(4))
  const evidence = check(root, { ...options, analyzeComplexity: fakeAnalyzer })
  assert.deepEqual(evidence.complexity.beforeUnavailable, ['src/legacy.js'])
  assert.deepEqual(evidence.complexity.functions, [])
})

test('missing lizard is reported as unavailable without blocking', (t) => {
  const root = repository(t)
  begin(root, options)
  fs.writeFileSync(path.join(root, 'src', 'legacy.js'), ifs(2))
  const evidence = check(root, { ...options, analyzeComplexity: () => null })
  assert.equal(evidence.complexity.status, 'unavailable')
  assert.equal(evidence.status, 'ok')
})

test('a project complexity threshold is advisory unless selected in blockSignals', (t) => {
  const advisory = repository(t, { complexity: { threshold: 3 } })
  begin(advisory, options)
  fs.writeFileSync(path.join(advisory, 'src', 'legacy.js'), ifs(4))
  const advised = check(advisory, { ...options, analyzeComplexity: fakeAnalyzer })
  assert.equal(advised.status, 'ok')
  assert.equal(advised.controls.signals[0].rule, 'complexity')
  assert.equal(advised.controls.signals[0].required, false)

  const blocking = repository(t, { complexity: { threshold: 3 }, blockSignals: ['complexity'] })
  begin(blocking, options)
  fs.writeFileSync(path.join(blocking, 'src', 'legacy.js'), ifs(4))
  assert.equal(check(blocking, { ...options, analyzeComplexity: fakeAnalyzer }).status, 'blocked')
  assert.match(hook(blocking).reason, /src\/legacy.js:1 complexity/)
})

test('the complexity block rule requires a threshold', (t) => {
  const root = repository(t, { blockSignals: ['complexity'] })
  assert.throws(() => begin(root, options), /requires complexity.threshold/)
})

test('real lizard output feeds the same delta', { skip: !findLizard() && 'lizard is not installed' }, (t) => {
  const root = repository(t)
  fs.writeFileSync(path.join(root, 'src', 'two.js'), 'function two(a) {\n  if (a > 1) {\n    return 1\n  }\n  return 0\n}\n')
  const functions = lizardFunctions(root, ['src/two.js'])
  assert.deepEqual(functions.map((fn) => [fn.file, fn.function, fn.ccn]), [['src/two.js', 'two', 2]])
})

const python = ['python3', 'python'].find((name) => {
  try {
    return spawnSync(name, ['--version'], { encoding: 'utf8' }).status === 0
  } catch {
    return false
  }
})

test('a lizard.py in the repository never runs through python -m lizard', { skip: !python && 'python is not installed' }, (t) => {
  const root = repository(t)
  const marker = path.join(root, 'lizard-ran')
  fs.writeFileSync(path.join(root, 'lizard.py'), `open(${JSON.stringify(marker)}, 'w').write('ran')\nprint('lizard 0.0.0')\n`)
  const previous = process.cwd()
  process.chdir(root)
  try {
    findLizard()
    try {
      lizardFunctions(root, ['src/legacy.js'], { launcher: [python, '-m', 'lizard'] })
    } catch {
      // Without a real lizard module the run fails; it must not import the repository's file.
    }
  } finally {
    process.chdir(previous)
  }
  assert.equal(fs.existsSync(marker), false)
})
