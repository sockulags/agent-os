import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

export const POLICY_PATH = '.agent-os/quality.json'
const SIGNALS = {
  'type-escape': /@ts-(?:ignore|nocheck|expect-error)\b|:\s*any\b|\bas\s+any\b/,
  'lint-disable': /eslint-disable|@SuppressWarnings\b/,
  'test-skip': /\b(?:it|test|describe)\s*\.\s*(?:skip|todo|only)\s*\(|\b[fx](?:it|describe)\s*\(|@Disabled\b/
}
const hash = value => createHash('sha256').update(value).digest('hex')
const identity = value => hash(JSON.stringify(value))
const runnerHash = identity(['project-controls.mjs', 'quality-delta.mjs'].map(name =>
  hash(fs.readFileSync(new URL(name, import.meta.url)))))

function relativeFile(value) {
  return typeof value === 'string' && value.length && !value.includes('\\') &&
    !value.includes('\0') && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) &&
    !/^[A-Za-z]:/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..' && part !== '.git')
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key))) throw new Error(`Invalid ${label} fields`)
}

export function readPolicy(root) {
  const file = path.join(root, POLICY_PATH)
  if (!fs.existsSync(file)) return { schema: 1, checks: [], blockSignals: [], protectedFiles: [] }
  const policy = JSON.parse(fs.readFileSync(file, 'utf8'))
  exactKeys(policy, ['schema', 'checks', 'blockSignals', 'protectedFiles'], 'quality policy')
  if (policy.schema !== 1 || !Array.isArray(policy.checks)) throw new Error('Quality policy requires schema 1 and checks')
  const ids = new Set()
  for (const check of policy.checks) {
    exactKeys(check, ['id', 'command', 'required', 'timeoutMs', 'cache'], 'check')
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(check.id) || ids.has(check.id)) throw new Error('Check IDs must be unique lowercase names')
    ids.add(check.id)
    if (!Array.isArray(check.command) || !check.command.length ||
        check.command.some(arg => typeof arg !== 'string' || arg.includes('\0')) || !check.command[0]) {
      throw new Error(`Check ${check.id} requires an argument array`)
    }
    if (check.required !== undefined && typeof check.required !== 'boolean') throw new Error('required must be boolean')
    if (check.timeoutMs !== undefined && (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1 || check.timeoutMs > 600000)) {
      throw new Error('timeoutMs must be between 1 and 600000')
    }
    if (check.cache !== undefined && check.cache !== false) {
      exactKeys(check.cache, ['kind', 'toolInputs'], 'cache')
      if (check.cache.kind !== 'static' || !Array.isArray(check.cache.toolInputs) ||
          !check.cache.toolInputs.length || !check.cache.toolInputs.every(relativeFile)) {
        throw new Error('Static cache requires explicit repository-relative toolInputs')
      }
    }
  }
  policy.blockSignals ??= []
  policy.protectedFiles ??= []
  if (!Array.isArray(policy.blockSignals) || policy.blockSignals.some(name => !Object.hasOwn(SIGNALS, name))) {
    throw new Error('Unknown blockSignals rule')
  }
  if (!Array.isArray(policy.protectedFiles) || !policy.protectedFiles.every(relativeFile)) throw new Error('Invalid protectedFiles')
  return policy
}

export function scanSignals(content) {
  const result = []
  content.toString('utf8').split(/\r?\n/).forEach((text, index) => {
    for (const [rule, pattern] of Object.entries(SIGNALS)) {
      if (pattern.test(text)) result.push({ rule, line: index + 1, text: text.trim().slice(0, 300) })
    }
  })
  return result
}

export function signalDelta(before, after) {
  const old = new Map(before.map(file => [file.path, file]))
  return after.flatMap(file => {
    const counts = new Map()
    for (const signal of old.get(file.path)?.signals || []) {
      const key = `${signal.rule}\0${signal.text}`
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return (file.signals || []).filter(signal => {
      const key = `${signal.rule}\0${signal.text}`
      const count = counts.get(key) || 0
      if (count) { counts.set(key, count - 1); return false }
      return true
    }).map(signal => ({ path: file.path, ...signal }))
  })
}

// Cache inputs are explicit, including ignored tool installations. Symlinks are rejected rather
// than treating the link text as evidence for the external file contents.
function inputHash(root, relative) {
  const chunks = []
  let ancestor = root
  for (const part of relative.split('/')) {
    ancestor = path.join(ancestor, part)
    if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error(`Symlink cache input: ${relative}`)
  }
  function visit(file) {
    const stat = fs.lstatSync(file)
    if (stat.isSymbolicLink()) throw new Error(`Symlink cache input: ${relative}`)
    chunks.push(path.relative(root, file), stat.mode)
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) visit(path.join(file, name))
    } else if (stat.isFile()) chunks.push(hash(fs.readFileSync(file)))
    else throw new Error(`Unsupported cache input: ${relative}`)
  }
  visit(path.join(root, relative))
  return identity(chunks)
}

function executable(root, name, env) {
  if (name === 'node') return process.execPath
  const candidates = name.includes('/') || name.includes('\\') || path.isAbsolute(name)
    ? [path.resolve(root, name)]
    : (env.PATH || env.Path || '').split(path.delimiter).map(dir => path.resolve(root, dir, name))
  const extensions = process.platform === 'win32' ? ['', ...(env.PATHEXT || '.EXE;.CMD;.BAT').split(';')] : ['']
  for (const candidate of candidates) for (const extension of extensions) {
    const file = candidate + extension
    try { if (fs.statSync(file).isFile()) return fs.realpathSync(file) } catch { /* try next */ }
  }
  throw new Error(`Executable unavailable: ${name}`)
}

export function prepareControls(root, files, env = process.env) {
  const policy = readPolicy(root)
  const fileIdentity = files.map(file => [file.path, file.kind, file.hash, file.mode])
  const environment = identity(Object.entries(env).sort(([a], [b]) => a.localeCompare(b)))
  const protectedIdentity = [POLICY_PATH, ...policy.protectedFiles].map(name => {
    try { return [name, inputHash(root, name)] } catch (error) {
      if (error.code === 'ENOENT') return [name, null]
      throw error
    }
  })
  const signature = identity({ policy, protectedIdentity })
  const checks = policy.checks.map(check => {
    try {
      if (check.cache && files.some(file => !['file', 'missing'].includes(file.kind))) {
        throw new Error('Static cache cannot verify repository symlinks, submodules, or special files; disable caching')
      }
      const program = executable(root, check.command[0], env)
      const toolInputs = (check.cache?.toolInputs || []).map(name => [name, inputHash(root, name)])
      const key = identity({ check, signature, fileIdentity, environment, runnerHash,
        runtime: process.versions, platform: process.platform, arch: process.arch,
        program, executable: hash(fs.readFileSync(program)), executableMode: fs.statSync(program).mode, toolInputs })
      return { ...check, program, key }
    } catch (error) {
      return { ...check, key: null, error: error.message }
    }
  })
  return { policy, signature, checks, fingerprint: identity({ signature, fileIdentity, environment,
    runnerHash, checks: checks.map(check => [check.id, check.key, check.error]) }) }
}

export function runControls(root, prepared, previous, env = process.env) {
  return prepared.checks.map(check => {
    const base = { id: check.id, command: check.command, required: check.required === true,
      inputFingerprint: check.key, scope: 'repository plus declared toolInputs', cached: false }
    if (check.error) return { ...base, status: 'unavailable', detail: check.error }
    const prior = previous?.results?.find(result => result.id === check.id)
    if (check.cache?.kind === 'static' && prior?.status === 'passed' && prior.inputFingerprint === check.key) {
      return { ...prior, cached: true }
    }
    const start = Date.now()
    const result = spawnSync(check.program, check.command.slice(1), {
      cwd: root, env, encoding: 'utf8', shell: false, timeout: check.timeoutMs ?? 60000,
      killSignal: 'SIGKILL', maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']
    })
    const status = result.error || result.signal ? 'error' : result.status === 0 ? 'passed' : 'failed'
    return { ...base, status, exitCode: result.status, durationMs: Date.now() - start,
      completedAt: new Date().toISOString(),
      detail: result.error?.message || result.signal || '',
      output: `${result.stdout || ''}${result.stderr || ''}`.slice(0, 16000) }
  })
}

export function blockingControls(report) {
  if (!report) return []
  return [
    ...(report.policyChanged ? ['quality policy changed: restore it or explicitly acknowledge the authorized change'] : []),
    ...(report.stale ? ['inputs changed during verification; run check again'] : []),
    ...report.results.filter(result => result.required && result.status !== 'passed').map(result => `${result.id}: ${result.status}`),
    ...report.signals.filter(signal => signal.required).map(signal => `${signal.path}:${signal.line} ${signal.rule}`)
  ]
}
