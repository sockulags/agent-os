// Optional deterministic analyzers. Agent OS never installs them; when one is missing its evidence
// is reported as unavailable and the core Node evidence still stands.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const LIZARD_LAUNCHERS = [['lizard'], ['python3', '-m', 'lizard'], ['python', '-m', 'lizard']]
const BATCH_SIZE = 200
const TIMEOUT_MS = 120000

function run(argv, cwd, spawn) {
  return spawn(argv[0], argv.slice(1), {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024
  })
}

// `python -m lizard` imports from its working directory first, so a lizard.py in the repository
// would run. Every lizard process therefore starts in an empty temporary directory and receives
// absolute file paths.
function inNeutralDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-lizard-'))
  try {
    return callback(directory)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

export function findLizard({ spawn = spawnSync } = {}) {
  return inNeutralDirectory((directory) => {
    for (const launcher of LIZARD_LAUNCHERS) {
      try {
        if (run([...launcher, '--version'], directory, spawn).status === 0) return launcher
      } catch { /* try the next launcher */ }
    }
    return null
  })
}

function csvFields(line) {
  const fields = []
  let field = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') { field += '"'; index += 1 }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') { fields.push(field); field = '' }
    else field += char
  }
  fields.push(field)
  return fields
}

// lizard --csv columns: NLOC, CCN, tokens, parameters, length, location, file, function,
// long name, start line, end line.
export function parseLizardCsv(text) {
  return text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const fields = csvFields(line)
    const ccn = Number(fields[1])
    if (fields.length < 11 || !Number.isInteger(ccn)) return []
    return [{
      file: fields[6].replaceAll('\\', '/'),
      function: fields[7],
      line: Number(fields[9]),
      ccn,
      nloc: Number(fields[0])
    }]
  })
}

// Runs lizard on repository-relative files under cwd. Returns null when lizard is unavailable.
export function lizardFunctions(cwd, files, { launcher = findLizard(), spawn = spawnSync } = {}) {
  if (!launcher) return null
  const root = path.resolve(cwd)
  const relative = (file) => path.isAbsolute(file) ? path.relative(root, file).replaceAll('\\', '/') : file
  return inNeutralDirectory((directory) => {
    const functions = []
    for (let start = 0; start < files.length; start += BATCH_SIZE) {
      const batch = files.slice(start, start + BATCH_SIZE).map((file) => path.join(root, file))
      const result = run([...launcher, '--csv', ...batch], directory, spawn)
      if (result.error || result.status !== 0) {
        throw new Error(`lizard failed: ${result.error?.message || result.stderr?.trim() || `exit ${result.status}`}`)
      }
      functions.push(...parseLizardCsv(result.stdout).map((fn) => ({ ...fn, file: relative(fn.file) })))
    }
    return functions
  })
}

// Same-named functions in one file are told apart by their order of appearance.
function keyed(functions) {
  const seen = new Map()
  return functions.map((fn) => {
    const base = `${fn.file}\0${fn.function}`
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    return { key: `${base}\0${count}`, fn }
  })
}

export function complexityDelta(before, after, { limit = 20 } = {}) {
  const previous = new Map(keyed(before).map(({ key, fn }) => [key, fn.ccn]))
  const rows = keyed(after).map(({ key, fn }) => ({
    path: fn.file,
    function: fn.function,
    line: fn.line,
    before: previous.has(key) ? previous.get(key) : null,
    after: fn.ccn
  }))
  const increased = rows.filter((row) => row.before !== null && row.after > row.before)
  const added = rows.filter((row) => row.before === null)
  const afterKeys = new Set(keyed(after).map(({ key }) => key))
  const decreased = rows.filter((row) => row.before !== null && row.after < row.before).length +
    [...previous.keys()].filter((key) => !afterKeys.has(key)).length
  const functions = [...increased, ...added.filter((row) => row.after > 1)]
    .sort((left, right) => right.after - left.after || (right.after - (right.before ?? 1)) - (left.after - (left.before ?? 1)))
  return {
    increased: increased.length,
    added: added.length,
    decreased,
    maxAfter: rows.reduce((max, row) => Math.max(max, row.after), 0),
    functions: functions.slice(0, limit),
    omitted: Math.max(0, functions.length - limit)
  }
}

export function withTemporaryFiles(files, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-analyzer-'))
  try {
    for (const [relativePath, content] of files) {
      const target = path.join(root, ...relativePath.split('/'))
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, content)
    }
    return callback(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}
