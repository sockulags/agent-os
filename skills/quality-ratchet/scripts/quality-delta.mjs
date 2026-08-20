#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const STATE_SCHEMA = 1
export const STATE_FILE_NAME = '.agent-os-quality-ratchet.json'
export const QUALITY_HOOK_MARKER = '--agent-os-hook=quality-ratchet'
export const HOOK_TIMEOUT_SECONDS = 10

const SOURCE_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.cxx', '.cs', '.css', '.go', '.h', '.hpp', '.java', '.js', '.jsx',
  '.jsonc', '.kts', '.kt', '.m', '.mjs', '.cjs', '.php', '.py', '.rb', '.rs', '.scala',
  '.sh', '.sql', '.swift', '.ts', '.tsx', '.vue', '.svelte'
])
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
]
const OPTIONAL_ANALYZERS = ['lizard', 'jscpd']

export class QualityRatchetError extends Error {
  constructor(message, code = 'QUALITY_RATCHET') {
    super(message)
    this.name = 'QualityRatchetError'
    this.code = code
  }
}

function error(message, code) {
  throw new QualityRatchetError(message, code)
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePath(value) {
  const resolved = path.resolve(value)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function runGit(root, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  if (result.status === 0) return result.stdout || ''
  if (allowFailure) return null
  const detail = result.stderr?.trim() || result.error?.message || `exit ${result.status}`
  error(`Git command failed: git -C "${root}" ${args.join(' ')}\n${detail}`, 'GIT_FAILURE')
}

function repositoryContext(cwd) {
  const requested = path.resolve(cwd)
  const rootText = runGit(requested, ['rev-parse', '--show-toplevel']).trim()
  const root = path.resolve(rootText)
  const gitDirText = runGit(root, ['rev-parse', '--git-dir']).trim()
  const gitDir = path.isAbsolute(gitDirText)
    ? path.normalize(gitDirText)
    : path.resolve(root, gitDirText)
  return { root, gitDir, statePath: path.join(gitDir, STATE_FILE_NAME) }
}

function splitGitPaths(value) {
  return value
    .split('\0')
    .filter(Boolean)
    .map((entry) => entry.replaceAll('\\', '/'))
}

function trackedPaths(root) {
  return splitGitPaths(runGit(root, ['ls-files', '-z']))
}

function untrackedPaths(root) {
  return splitGitPaths(runGit(root, ['ls-files', '--others', '--exclude-standard', '-z']))
}

function isWithinRoot(root, target) {
  const relative = path.relative(root, target)
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function absolutePath(root, relativePath) {
  const target = path.resolve(root, ...relativePath.split('/'))
  if (!isWithinRoot(root, target)) error(`Git returned a path outside the repository: ${relativePath}`, 'GIT_PATH')
  return target
}

function isSourcePath(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/')
  if (normalized.split('/').some((part) => ['.git', 'node_modules', 'dist', 'build', 'coverage'].includes(part))) {
    return false
  }
  return SOURCE_EXTENSIONS.has(path.posix.extname(normalized).toLowerCase())
}

function countNloc(buffer) {
  return buffer.toString('utf8').split(/\r?\n/).reduce((count, line) => {
    const trimmed = line.trim()
    if (!trimmed) return count
    if (/^(?:\/\/|\/\*|\*\/|\*\s|<!--|-->)/.test(trimmed)) return count
    if (/^#(?:\s|!)/.test(trimmed)) return count
    return count + 1
  }, 0)
}

function missingRecord(relativePath, source) {
  return {
    path: relativePath,
    kind: 'missing',
    hash: null,
    bytes: 0,
    source,
    nloc: 0
  }
}

function fileRecord(root, relativePath) {
  const source = isSourcePath(relativePath)
  const target = absolutePath(root, relativePath)
  let stats
  try {
    stats = fs.lstatSync(target)
  } catch (cause) {
    if (cause.code === 'ENOENT') return missingRecord(relativePath, source)
    error(`Cannot inspect ${relativePath}: ${cause.message}`, 'SNAPSHOT_FAILURE')
  }

  if (stats.isSymbolicLink()) {
    const link = fs.readlinkSync(target)
    return {
      path: relativePath,
      kind: 'symlink',
      hash: digest(link),
      bytes: Buffer.byteLength(link),
      source,
      nloc: 0
    }
  }

  if (!stats.isFile()) {
    return {
      path: relativePath,
      kind: stats.isDirectory() ? 'directory' : 'other',
      hash: null,
      bytes: 0,
      source,
      nloc: 0
    }
  }

  let content
  try {
    content = fs.readFileSync(target)
  } catch (cause) {
    error(`Cannot read ${relativePath}: ${cause.message}`, 'SNAPSHOT_FAILURE')
  }
  return {
    path: relativePath,
    kind: 'file',
    hash: digest(content),
    bytes: content.byteLength,
    source,
    nloc: source ? countNloc(content) : 0
  }
}

function fileFingerprintRecord(record) {
  return [record.path, record.kind, record.hash, record.bytes, record.source, record.nloc]
}

function snapshot(root) {
  const paths = [...new Set([...trackedPaths(root), ...untrackedPaths(root)])].sort()
  const files = paths.map((relativePath) => fileRecord(root, relativePath))
  return {
    files,
    fingerprint: digest(JSON.stringify(files.map(fileFingerprintRecord))),
    sourceNloc: files.reduce((total, file) => total + (file.source ? file.nloc : 0), 0),
    head: runGit(root, ['rev-parse', 'HEAD'], { allowFailure: true })?.trim() || null
  }
}

function commandDetected(command, spawn = spawnSync) {
  const lookup = process.platform === 'win32' ? 'where.exe' : 'which'
  try {
    const result = spawn(lookup, [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return result.status === 0
  } catch {
    return false
  }
}

function unavailableAnalyzer(reason) {
  return { status: 'unavailable', available: false, integrated: false, reason }
}

function normalizeAnalyzer(value, name) {
  if (!value || typeof value !== 'object') {
    return unavailableAnalyzer(`${name} capability detection returned no result`)
  }
  const status = typeof value.status === 'string' ? value.status : 'unavailable'
  return {
    status,
    available: value.available === true,
    integrated: value.integrated === true,
    reason: typeof value.reason === 'string' ? value.reason : 'No analyzer result was provided.'
  }
}

export function detectOptionalAnalyzers({ spawn = spawnSync } = {}) {
  return Object.fromEntries(OPTIONAL_ANALYZERS.map((name) => [
    name,
    commandDetected(name, spawn)
      ? {
          status: 'detected-not-integrated',
          available: true,
          integrated: false,
          reason: `${name} was detected but is not integrated; core Node evidence is used.`
        }
      : unavailableAnalyzer(`${name} is not installed; core Node evidence is used.`)
  ]))
}

function safeAnalyzerDetection(detector) {
  try {
    const detected = detector()
    return Object.fromEntries(OPTIONAL_ANALYZERS.map((name) => [
      name,
      normalizeAnalyzer(detected?.[name], name)
    ]))
  } catch (cause) {
    return Object.fromEntries(OPTIONAL_ANALYZERS.map((name) => [
      name,
      unavailableAnalyzer(`Capability detection failed: ${cause.message}`)
    ]))
  }
}

function packageDependencies(root) {
  const packagePath = path.join(root, 'package.json')
  if (!fs.existsSync(packagePath)) {
    return { status: 'unavailable', reason: 'package.json is absent.', dependencies: {} }
  }
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  } catch (cause) {
    return { status: 'unavailable', reason: `package.json could not be parsed: ${cause.message}`, dependencies: {} }
  }
  const dependencies = {}
  for (const section of DEPENDENCY_SECTIONS) {
    const values = manifest?.[section]
    if (!values || typeof values !== 'object' || Array.isArray(values)) continue
    for (const name of Object.keys(values).sort()) {
      dependencies[`${section}:${name}`] = String(values[name])
    }
  }
  return { status: 'available', reason: 'Root package.json dependency sections were read.', dependencies }
}

function dependencyDiff(before, after) {
  if (before.status !== 'available' || after.status !== 'available') {
    return {
      status: 'unavailable',
      reason: `Dependency comparison unavailable: before=${before.reason} after=${after.reason}`,
      added: [],
      removed: [],
      updated: []
    }
  }
  const beforeValues = before.dependencies
  const afterValues = after.dependencies
  const added = []
  const removed = []
  const updated = []
  for (const key of [...new Set([...Object.keys(beforeValues), ...Object.keys(afterValues)])].sort()) {
    const [section, ...nameParts] = key.split(':')
    const name = nameParts.join(':')
    if (!(key in beforeValues)) {
      added.push({ section, name, version: afterValues[key] })
    } else if (!(key in afterValues)) {
      removed.push({ section, name, version: beforeValues[key] })
    } else if (beforeValues[key] !== afterValues[key]) {
      updated.push({ section, name, before: beforeValues[key], after: afterValues[key] })
    }
  }
  return {
    status: 'available',
    reason: 'Root package.json dependency sections were compared.',
    added,
    removed,
    updated
  }
}

function fileMap(files) {
  return new Map(files.map((file) => [file.path, file]))
}

function changedPaths(beforeFiles, afterFiles) {
  const before = fileMap(beforeFiles)
  const after = fileMap(afterFiles)
  const added = []
  const changed = []
  const deleted = []
  for (const relativePath of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const previous = before.get(relativePath)
    const current = after.get(relativePath)
    if (!previous) {
      if (current.source) added.push(relativePath)
    } else if (!current) {
      if (previous.source) deleted.push(relativePath)
    } else if (JSON.stringify(fileFingerprintRecord(previous)) !== JSON.stringify(fileFingerprintRecord(current))) {
      if (previous.source || current.source) changed.push(relativePath)
    }
  }
  return { added, changed, deleted }
}

function touchedLegacy(beforeFiles, afterFiles, touchedPaths) {
  const before = fileMap(beforeFiles)
  const after = fileMap(afterFiles)
  const beforeFilesTouched = touchedPaths.filter((relativePath) => before.get(relativePath)?.source)
  const afterFilesTouched = touchedPaths.filter((relativePath) => before.get(relativePath)?.source && after.get(relativePath)?.source)
  return {
    before: {
      status: beforeFilesTouched.length ? 'touched' : 'none',
      files: beforeFilesTouched
    },
    after: {
      status: afterFilesTouched.length ? 'touched' : 'none',
      files: afterFilesTouched
    }
  }
}

function touchedNloc(beforeFiles, afterFiles, touchedPaths) {
  const before = fileMap(beforeFiles)
  const after = fileMap(afterFiles)
  const beforeNloc = touchedPaths.reduce((total, relativePath) => total + (before.get(relativePath)?.nloc || 0), 0)
  const afterNloc = touchedPaths.reduce((total, relativePath) => total + (after.get(relativePath)?.nloc || 0), 0)
  return { before: beforeNloc, after: afterNloc, delta: afterNloc - beforeNloc }
}

function evidenceFor(state, candidate, dependencies, analyzers) {
  const sourceFiles = changedPaths(state.entry.files, candidate.files)
  const touchedPaths = [...new Set([
    ...sourceFiles.added,
    ...sourceFiles.changed,
    ...sourceFiles.deleted
  ])].sort()
  return {
    schema: STATE_SCHEMA,
    status: 'ok',
    baselineFingerprint: state.entry.fingerprint,
    candidateFingerprint: candidate.fingerprint,
    sourceFiles,
    sourceNloc: touchedNloc(state.entry.files, candidate.files, touchedPaths),
    touchedLegacy: touchedLegacy(state.entry.files, candidate.files, touchedPaths),
    packageDependencies: dependencyDiff(state.entry.packageDependencies, dependencies),
    optionalAnalyzers: {
      baseline: state.entry.optionalAnalyzers,
      candidate: analyzers
    },
    entryHead: state.entry.head,
    candidateHead: candidate.head
  }
}

function readState(context) {
  if (!fs.existsSync(context.statePath)) return null
  let state
  try {
    state = JSON.parse(fs.readFileSync(context.statePath, 'utf8'))
  } catch (cause) {
    error(`Quality ratchet state is corrupt at ${context.statePath}: ${cause.message}. Run clear, then begin again.`, 'STATE_CORRUPT')
  }
  const filesValid = Array.isArray(state?.entry?.files) && state.entry.files.every((file) =>
    file && typeof file.path === 'string' && typeof file.source === 'boolean' && Number.isInteger(file.nloc))
  const pathsValid = typeof state?.repositoryRoot === 'string' && typeof state?.gitDir === 'string'
  const fingerprintValid = filesValid && state.entry.fingerprint ===
    digest(JSON.stringify(state.entry.files.map(fileFingerprintRecord)))
  if (!state || state.schema !== STATE_SCHEMA || state.state !== 'active' || !pathsValid ||
      normalizePath(state.repositoryRoot) !== normalizePath(context.root) ||
      normalizePath(state.gitDir) !== normalizePath(context.gitDir) ||
      !state.entry || typeof state.entry.fingerprint !== 'string' || !filesValid || !fingerprintValid ||
      !state.entry.packageDependencies || typeof state.entry.packageDependencies.status !== 'string' ||
      !state.entry.optionalAnalyzers || typeof state.entry.optionalAnalyzers !== 'object') {
    error(`Quality ratchet state is invalid or belongs to another worktree at ${context.statePath}. Run clear, then begin again.`, 'STATE_INVALID')
  }
  if (state.lastCheck !== null &&
      (!state.lastCheck || typeof state.lastCheck.candidateFingerprint !== 'string')) {
    error(`Quality ratchet state has an invalid last check at ${context.statePath}. Run clear, then begin again.`, 'STATE_INVALID')
  }
  return state
}

function writeState(context, state) {
  fs.mkdirSync(context.gitDir, { recursive: true })
  const temporary = path.join(context.gitDir, `${STATE_FILE_NAME}.${randomUUID()}.tmp`)
  try {
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n')
    fs.renameSync(temporary, context.statePath)
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true })
  }
}

function baselineState(context, candidate, dependencies, analyzers) {
  return {
    schema: STATE_SCHEMA,
    state: 'active',
    repositoryRoot: path.resolve(context.root),
    gitDir: path.resolve(context.gitDir),
    entry: {
      fingerprint: candidate.fingerprint,
      head: candidate.head,
      sourceNloc: candidate.sourceNloc,
      fileCount: candidate.files.length,
      files: candidate.files,
      packageDependencies: dependencies,
      optionalAnalyzers: analyzers
    },
    lastCheck: null
  }
}

export function begin(cwd = process.cwd(), { detect = detectOptionalAnalyzers } = {}) {
  const context = repositoryContext(cwd)
  if (fs.existsSync(context.statePath)) {
    readState(context)
    error(`An active quality ratchet baseline already exists for this worktree at ${context.statePath}. Run clear before beginning a new delivery.`, 'BASELINE_ACTIVE')
  }
  const candidate = snapshot(context.root)
  const dependencies = packageDependencies(context.root)
  const analyzers = safeAnalyzerDetection(detect)
  const state = baselineState(context, candidate, dependencies, analyzers)
  writeState(context, state)
  return {
    statePath: context.statePath,
    fingerprint: candidate.fingerprint,
    fileCount: candidate.files.length,
    sourceNloc: candidate.sourceNloc
  }
}

export function check(cwd = process.cwd(), { detect = detectOptionalAnalyzers } = {}) {
  const context = repositoryContext(cwd)
  const state = readState(context)
  if (!state) error(`No active quality ratchet baseline exists for ${context.root}. Run begin before the first mutation.`, 'BASELINE_MISSING')
  const candidate = snapshot(context.root)
  const dependencies = packageDependencies(context.root)
  const analyzers = safeAnalyzerDetection(detect)
  const evidence = evidenceFor(state, candidate, dependencies, analyzers)
  state.lastCheck = {
    candidateFingerprint: candidate.fingerprint,
    evidence
  }
  writeState(context, state)
  return evidence
}

export function clear(cwd = process.cwd()) {
  const context = repositoryContext(cwd)
  if (fs.existsSync(context.statePath)) fs.rmSync(context.statePath, { force: true })
  return { statePath: context.statePath, cleared: true }
}

function allowResult() {
  return {}
}

function blockResult(reason) {
  return { decision: 'block', reason }
}

function lifecycleCommand(command) {
  return `"${process.execPath}" "${fileURLToPath(import.meta.url)}" ${command}`
}

export function hook(cwd = process.cwd(), payload = {}) {
  const stopHookActive = payload?.stop_hook_active === true
  let context
  try {
    context = repositoryContext(cwd)
  } catch {
    return allowResult()
  }
  if (!fs.existsSync(context.statePath)) return allowResult()

  try {
    const state = readState(context)
    if (!state) return allowResult()
    let candidate
    try {
      candidate = snapshot(context.root)
    } catch (cause) {
      const reason = `Quality ratchet could not inspect the candidate: ${cause.message}. Run the quality-ratchet check and retry.`
      return stopHookActive ? allowResult() : blockResult(reason)
    }
    const fresh = state.lastCheck?.candidateFingerprint === candidate.fingerprint
    if (fresh) {
      fs.rmSync(context.statePath, { force: true })
      return allowResult()
    }
    const reason = state.lastCheck
      ? `Quality ratchet check is stale for the current candidate. Run \`${lifecycleCommand('check')}\` before stopping.`
      : `Quality ratchet has an active baseline but no check for this candidate. Run \`${lifecycleCommand('check')}\` before stopping.`
    return stopHookActive ? allowResult() : blockResult(reason)
  } catch (cause) {
    const reason = cause instanceof QualityRatchetError
      ? cause.message
      : `Quality ratchet lifecycle error: ${cause.message}`
    return stopHookActive ? allowResult() : blockResult(reason)
  }
}

function humanList(values) {
  return values.length ? values.join(', ') : 'none'
}

export function formatEvidence(evidence) {
  const lines = [
    'Agent OS quality-ratchet evidence',
    `Source files: +${evidence.sourceFiles.added.length} ~${evidence.sourceFiles.changed.length} -${evidence.sourceFiles.deleted.length}`,
    `  added: ${humanList(evidence.sourceFiles.added)}`,
    `  changed: ${humanList(evidence.sourceFiles.changed)}`,
    `  deleted: ${humanList(evidence.sourceFiles.deleted)}`,
    `Source NLOC (touched): ${evidence.sourceNloc.before} -> ${evidence.sourceNloc.after} (delta ${evidence.sourceNloc.delta >= 0 ? '+' : ''}${evidence.sourceNloc.delta})`,
    `Touched legacy before: ${evidence.touchedLegacy.before.status} (${humanList(evidence.touchedLegacy.before.files)})`,
    `Touched legacy after: ${evidence.touchedLegacy.after.status} (${humanList(evidence.touchedLegacy.after.files)})`,
    `Package dependencies: +${evidence.packageDependencies.added.length} -${evidence.packageDependencies.removed.length} ~${evidence.packageDependencies.updated.length} (${evidence.packageDependencies.status})`,
    ...OPTIONAL_ANALYZERS.map((name) => `Optional analyzer ${name}: ${evidence.optionalAnalyzers.candidate[name].status} — ${evidence.optionalAnalyzers.candidate[name].reason}`),
    `Candidate fingerprint: ${evidence.candidateFingerprint}`,
    `Machine-readable evidence: ${JSON.stringify(evidence)}`
  ]
  return lines.join('\n')
}

function parseArguments(args) {
  const result = { command: args[0] || 'check', root: process.cwd(), json: false }
  let index = 1
  while (index < args.length) {
    const argument = args[index]
    if (argument === '--json') {
      result.json = true
    } else if (argument === '--root') {
      const root = args[index + 1]
      if (!root || root.startsWith('-')) error('--root requires a path.', 'ARGUMENTS')
      result.root = root
      index += 1
    } else if (argument.startsWith('--root=')) {
      result.root = argument.slice('--root='.length)
      if (!result.root) error('--root requires a path.', 'ARGUMENTS')
    } else if (argument === QUALITY_HOOK_MARKER) {
      // The marker makes direct-installed commands identifiable and is ignored by the engine.
    } else {
      error(`Unknown option "${argument}".`, 'ARGUMENTS')
    }
    index += 1
  }
  if (!['begin', 'check', 'clear', 'hook'].includes(result.command)) {
    error(`Unknown command "${result.command}". Use begin, check, clear, or hook.`, 'ARGUMENTS')
  }
  return result
}

function readHookPayload() {
  try {
    const input = fs.readFileSync(0, 'utf8').trim()
    return input ? JSON.parse(input) : {}
  } catch {
    return {}
  }
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.command === 'begin') {
      const result = begin(options.root)
      console.log(`Quality ratchet baseline started for ${result.fileCount} files (${result.fingerprint}).`)
      return
    }
    if (options.command === 'check') {
      const evidence = check(options.root)
      console.log(options.json ? JSON.stringify(evidence) : formatEvidence(evidence))
      return
    }
    if (options.command === 'clear') {
      const result = clear(options.root)
      console.log(`Quality ratchet baseline cleared at ${result.statePath}.`)
      return
    }
    const payload = readHookPayload()
    const result = hook(payload.cwd || options.root, payload)
    console.log(JSON.stringify(result))
    if (result.decision === 'block') process.exitCode = 2
  } catch (cause) {
    console.error(`quality-ratchet: ${cause.message}`)
    process.exitCode = cause instanceof QualityRatchetError && cause.code === 'ARGUMENTS' ? 2 : 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
