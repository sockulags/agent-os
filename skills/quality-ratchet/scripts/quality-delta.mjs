#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  prepareControls, runControls, scanSignals, signalDelta, blockingControls, POLICY_PATH,
  readPolicy, controlSignature, controlsTrusted, recordControlsTrust, DEFAULT_TRUST_STORE
} from './project-controls.mjs'
import { complexityDelta, findLizard, lizardFunctions, withTemporaryFiles } from './analyzers.mjs'

export const STATE_SCHEMA = 2
export const STATE_FILE_NAME = '.agent-os-quality-ratchet.json'
export const QUALITY_HOOK_MARKER = '--agent-os-hook=quality-ratchet'
export const HOOK_TIMEOUT_SECONDS = 10
export const STOP_BLOCK_LIMIT = 3
export const STALE_STATE_DAYS = 14

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
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
const SESSION_ENVIRONMENT = [
  ['codex', 'CODEX_THREAD_ID'],
  ['claude', 'CLAUDE_CODE_SESSION_ID']
]

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

function sessionIdentity(env = process.env) {
  for (const [source, variable] of SESSION_ENVIRONMENT) {
    const value = env?.[variable]
    if (typeof value === 'string' && value.trim()) {
      return {
        source,
        key: `${source}-${digest(`${source}\0${value.trim()}`).slice(0, 32)}`
      }
    }
  }
  return { source: 'standalone', key: 'standalone' }
}

function hookSessionEnvironment(payload, env) {
  const sessionId = typeof payload?.session_id === 'string' ? payload.session_id.trim() : ''
  if (!sessionId) return env
  const codex = typeof payload?.turn_id === 'string' && payload.turn_id.trim()
  return codex
    ? { ...env, CLAUDE_CODE_SESSION_ID: '', CODEX_THREAD_ID: sessionId }
    : { ...env, CODEX_THREAD_ID: '', CLAUDE_CODE_SESSION_ID: sessionId }
}

function normalizePath(value) {
  const resolved = path.resolve(value)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function isSafeGitRelativePath(value) {
  return typeof value === 'string' && value.length > 0 &&
    value === value.replaceAll('\\', '/') && !value.includes('\0') &&
    !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) && !/^[A-Za-z]:/.test(value) &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}

function canonicalGitPaths(value) {
  return Array.isArray(value) && value.every(isSafeGitRelativePath) &&
    value.every((relativePath, index) => index === 0 || value[index - 1] < relativePath)
}

function validHead(value) {
  return value === null || (typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value))
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

function repositoryContext(cwd, env = process.env) {
  const requested = path.resolve(cwd)
  const rootText = runGit(requested, ['rev-parse', '--show-toplevel']).trim()
  const root = path.resolve(rootText)
  const gitDirText = runGit(root, ['rev-parse', '--git-dir']).trim()
  const gitDir = path.isAbsolute(gitDirText)
    ? path.normalize(gitDirText)
    : path.resolve(root, gitDirText)
  const session = sessionIdentity(env)
  return {
    root,
    gitDir,
    session,
    statePath: path.join(gitDir, `${STATE_FILE_NAME}.${session.key}`)
  }
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

function gitStatusEntries(root) {
  const tokens = runGit(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
    .split('\0')
    .filter(Boolean)
  const entries = []
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    const status = token.slice(0, 2)
    const relativePath = token.slice(3).replaceAll('\\', '/')
    entries.push({ status, path: relativePath })
    if (status.includes('R') || status.includes('C')) {
      const previousPath = tokens[index + 1]
      if (previousPath !== undefined) {
        entries.push({ status, path: previousPath.replaceAll('\\', '/') })
        index += 1
      }
    }
  }
  return entries.sort((left, right) => {
    const leftKey = `${left.status}\0${left.path}`
    const rightKey = `${right.status}\0${right.path}`
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  })
}

function gitState(root) {
  const status = gitStatusEntries(root)
  return {
    head: runGit(root, ['rev-parse', 'HEAD'], { allowFailure: true })?.trim() || null,
    status,
    dirtyPaths: [...new Set(status.map((entry) => entry.path))].sort()
  }
}

function changedHeadPaths(root, beforeHead, afterHead) {
  if (!afterHead || beforeHead === afterHead) return []
  return splitGitPaths(runGit(root, [
    'diff', '--name-only', '--no-renames', '-z', beforeHead || EMPTY_TREE, afterHead
  ]))
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

export function isSourcePath(relativePath) {
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
    nloc: source ? countNloc(content) : 0,
    mode: stats.mode,
    signals: source ? scanSignals(content) : []
  }
}

function fileFingerprintRecord(record) {
  return [record.path, record.kind, record.hash, record.bytes, record.source, record.nloc]
}

function entryFingerprint(files, dirtyPaths, head) {
  return digest(JSON.stringify({
    files: files.map(fileFingerprintRecord),
    dirtyPaths,
    head
  }))
}

function snapshot(root) {
  const git = gitState(root)
  const paths = [...new Set([...trackedPaths(root), ...untrackedPaths(root)])].sort()
  const files = paths.map((relativePath) => fileRecord(root, relativePath))
  return {
    files,
    fingerprint: entryFingerprint(files, git.dirtyPaths, git.head),
    sourceNloc: files.reduce((total, file) => total + (file.source ? file.nloc : 0), 0),
    head: git.head,
    dirtyPaths: git.dirtyPaths
  }
}

function mergeCandidateFiles(baselineFiles, inspected) {
  const files = baselineFiles.map((file) => inspected.get(file.path) || file)
  const knownPaths = new Set(files.map((file) => file.path))
  for (const file of inspected.values()) {
    if (!knownPaths.has(file.path) && file.kind !== 'missing') files.push(file)
  }
  return files.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

function candidateSnapshot(root, entry, { includeFiles = true } = {}) {
  const git = gitState(root)
  const headPaths = changedHeadPaths(root, entry.head, git.head)
  const relevantPaths = [...new Set([
    ...entry.dirtyPaths,
    ...git.dirtyPaths,
    ...headPaths
  ])].sort()
  const inspected = new Map(relevantPaths.map((relativePath) => [relativePath, fileRecord(root, relativePath)]))
  const files = includeFiles ? mergeCandidateFiles(entry.files, inspected) : null
  return {
    files,
    fingerprint: digest(JSON.stringify({
      head: git.head,
      status: git.status,
      files: relevantPaths.map((relativePath) => fileFingerprintRecord(inspected.get(relativePath)))
    })),
    head: git.head
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
  const lizard = findLizard({ spawn })
    ? {
        status: 'integrated',
        available: true,
        integrated: true,
        reason: 'lizard computes cyclomatic complexity deltas for touched source files.'
      }
    : unavailableAnalyzer('lizard is not installed; complexity deltas are unavailable and core Node evidence is used.')
  return Object.fromEntries(OPTIONAL_ANALYZERS.map((name) => [
    name,
    name === 'lizard' ? lizard : commandDetected(name, spawn)
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
    } else if (current.kind === 'missing' && previous.kind !== 'missing') {
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
  const afterFilesTouched = touchedPaths.filter((relativePath) => before.get(relativePath)?.source &&
    after.get(relativePath)?.kind !== 'missing' && after.get(relativePath)?.source)
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

// Entry content is recoverable only for paths that were clean at begin: the baseline stores
// hashes, not file contents. The working tree may hold either the filtered (line-ending converted)
// or the raw blob form, so the one matching the recorded hash is used.
function entryContent(root, entry, relativePath) {
  const record = entry.files.find((file) => file.path === relativePath)
  if (!record || record.kind !== 'file' || !entry.head || entry.dirtyPaths.includes(relativePath)) return null
  const spec = `${entry.head}:${relativePath}`
  for (const args of [['cat-file', '--filters', spec], ['cat-file', 'blob', spec]]) {
    const content = runGit(root, args, { allowFailure: true })
    if (content !== null && digest(content) === record.hash) return content
  }
  return null
}

function complexityEvidence(root, entry, sourceFiles, analyze) {
  const touched = [...sourceFiles.added, ...sourceFiles.changed].sort()
  if (!touched.length) return { status: 'available', reason: 'No touched source files remain.', ...complexityDelta([], []), beforeUnavailable: [] }
  try {
    const after = analyze(root, touched)
    if (after === null) {
      return { status: 'unavailable', reason: 'lizard is not installed; complexity deltas were not computed.' }
    }
    const beforeFiles = sourceFiles.changed.map((relativePath) => [relativePath, entryContent(root, entry, relativePath)])
    const known = beforeFiles.filter(([, content]) => content !== null)
    const beforeUnavailable = beforeFiles.filter(([, content]) => content === null).map(([relativePath]) => relativePath)
    const before = known.length ? withTemporaryFiles(known, (directory) => analyze(directory, known.map(([file]) => file))) : []
    const comparable = after.filter((fn) => !beforeUnavailable.includes(fn.file))
    return {
      status: 'available',
      reason: 'lizard cyclomatic complexity for touched source files.',
      ...complexityDelta(before, comparable),
      beforeUnavailable
    }
  } catch (cause) {
    return { status: 'unavailable', reason: `Complexity analysis failed: ${cause.message}` }
  }
}

function complexitySignals(complexity, policy) {
  const threshold = policy.complexity?.threshold
  if (!threshold || complexity.status !== 'available') return []
  return complexity.functions.filter((fn) => fn.after > threshold).map((fn) => ({
    path: fn.path,
    line: fn.line,
    rule: 'complexity',
    text: `${fn.function} cyclomatic complexity ${fn.before ?? 'new'} -> ${fn.after} (threshold ${threshold})`,
    required: policy.blockSignals.includes('complexity')
  }))
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
  const dirtyPathsValid = canonicalGitPaths(state?.entry?.dirtyPaths)
  const headValid = validHead(state?.entry?.head)
  const sessionValid = state?.session && typeof state.session.source === 'string' &&
    typeof state.session.key === 'string' && state.session.source === context.session.source &&
    state.session.key === context.session.key
  const pathsValid = typeof state?.repositoryRoot === 'string' && typeof state?.gitDir === 'string'
  const fingerprintValid = filesValid && dirtyPathsValid && headValid && state.entry.fingerprint ===
    entryFingerprint(state.entry.files, state.entry.dirtyPaths, state.entry.head)
  if (!state || state.schema !== STATE_SCHEMA || state.state !== 'active' || !pathsValid ||
      normalizePath(state.repositoryRoot) !== normalizePath(context.root) ||
      normalizePath(state.gitDir) !== normalizePath(context.gitDir) ||
      !sessionValid ||
      !state.entry || typeof state.entry.fingerprint !== 'string' || !filesValid || !dirtyPathsValid || !headValid ||
      !fingerprintValid ||
      !state.entry.packageDependencies || typeof state.entry.packageDependencies.status !== 'string' ||
      !state.entry.optionalAnalyzers || typeof state.entry.optionalAnalyzers !== 'object') {
    error(`Quality ratchet state is invalid or belongs to another session or worktree at ${context.statePath}. Run clear, then begin again.`, 'STATE_INVALID')
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
    session: context.session,
    entry: {
      fingerprint: candidate.fingerprint,
      head: candidate.head,
      dirtyPaths: candidate.dirtyPaths,
      sourceNloc: candidate.sourceNloc,
      fileCount: candidate.files.length,
      files: candidate.files,
      packageDependencies: dependencies,
      optionalAnalyzers: analyzers
    },
    lastCheck: null
  }
}

// Baselines now outlive a single turn, so an attempt that never reached `finish` or `clear` leaves
// its state behind. Remove other sessions' state and reports untouched for STALE_STATE_DAYS.
function pruneStaleStates(context, now = Date.now()) {
  let names
  try {
    names = fs.readdirSync(context.gitDir)
  } catch {
    return
  }
  const limit = STALE_STATE_DAYS * 24 * 60 * 60 * 1000
  for (const name of names) {
    if (!name.startsWith(`${STATE_FILE_NAME}.`)) continue
    const file = path.join(context.gitDir, name)
    if (file === context.statePath) continue
    try {
      if (now - fs.statSync(file).mtimeMs > limit) fs.rmSync(file, { force: true })
    } catch {
      // Another session may remove its own state concurrently.
    }
  }
}

export function begin(cwd = process.cwd(), { detect = detectOptionalAnalyzers, env = process.env } = {}) {
  const context = repositoryContext(cwd, env)
  pruneStaleStates(context)
  if (fs.existsSync(context.statePath)) {
    readState(context)
    error(`An active quality ratchet baseline already exists for this session and worktree at ${context.statePath}. Run clear before beginning a new delivery.`, 'BASELINE_ACTIVE')
  }
  const candidate = snapshot(context.root)
  const dependencies = packageDependencies(context.root)
  const analyzers = safeAnalyzerDetection(detect)
  const state = baselineState(context, candidate, dependencies, analyzers)
  state.entry.hasControlPolicy = fs.existsSync(path.join(context.root, POLICY_PATH))
  state.entry.controlSignature = prepareControls(context.root, candidate.files, env).signature
  writeState(context, state)
  return {
    statePath: context.statePath,
    fingerprint: candidate.fingerprint,
    fileCount: candidate.files.length,
    sourceNloc: candidate.sourceNloc
  }
}

function defaultComplexityAnalyzer() {
  let launcher
  return (cwd, files) => {
    if (launcher === undefined) launcher = findLizard()
    return lizardFunctions(cwd, files, { launcher })
  }
}

export function check(cwd = process.cwd(), {
  detect = detectOptionalAnalyzers,
  env = process.env,
  acceptPolicyChange = '',
  analyzeComplexity = defaultComplexityAnalyzer(),
  trustStore = DEFAULT_TRUST_STORE
} = {}) {
  const context = repositoryContext(cwd, env)
  const state = readState(context)
  if (!state) error(`No active quality ratchet baseline exists for ${context.root}. Run begin before the first mutation.`, 'BASELINE_MISSING')
  const candidate = candidateSnapshot(context.root, state.entry)
  const dependencies = packageDependencies(context.root)
  const analyzers = safeAnalyzerDetection(detect)
  const evidence = evidenceFor(state, candidate, dependencies, analyzers)
  const configured = state.entry.hasControlPolicy || fs.existsSync(path.join(context.root, POLICY_PATH))
  const files = configured ? snapshot(context.root).files : candidate.files
  const prepared = prepareControls(context.root, files, env)
  // Old evidence-only baselines can continue without opting into project commands mid-flight.
  const oldSignature = state.entry.controlSignature
  const policyChanged = oldSignature ? oldSignature !== prepared.signature : fs.existsSync(path.join(context.root, POLICY_PATH))
  if (acceptPolicyChange && !acceptPolicyChange.trim()) error('Policy acknowledgement requires a reason.', 'ARGUMENTS')
  const accepted = policyChanged && Boolean(acceptPolicyChange.trim())
  evidence.complexity = complexityEvidence(context.root, state.entry, evidence.sourceFiles, analyzeComplexity)
  const signals = [
    ...signalDelta(state.entry.files, files).map(signal => ({
      ...signal, required: prepared.policy.blockSignals.includes(signal.rule)
    })),
    ...complexitySignals(evidence.complexity, prepared.policy)
  ]
  // CI already runs the repository's own code in a disposable checkout and cannot answer a prompt.
  const ciEnvironment = ['true', '1'].includes(String(env.CI ?? '').toLowerCase())
  const trusted = !prepared.policy.checks.length || ciEnvironment ||
    controlsTrusted(repositoryIdentity(context.root), prepared.signature, trustStore)
  const results = (policyChanged && !accepted) || !trusted ? [] : runControls(context.root, prepared, state.lastCheck?.evidence?.controls, env)
  const after = configured ? prepareControls(context.root, snapshot(context.root).files, env) : prepared
  evidence.controls = {
    fingerprint: prepared.fingerprint, policyChanged: policyChanged && !accepted,
    untrusted: trusted ? null : {
      commands: prepared.policy.checks.map(entry => ({ id: entry.id, command: entry.command })),
      trustCommand: developerTrustCommand(context.root)
    },
    policyAcknowledgement: accepted ? { before: oldSignature || null, after: prepared.signature, reason: acceptPolicyChange.trim() } : state.policyAcknowledgement || null,
    stale: after.fingerprint !== prepared.fingerprint, results, signals
  }
  if (accepted && !evidence.controls.stale) {
    state.entry.controlSignature = prepared.signature
    state.policyAcknowledgement = evidence.controls.policyAcknowledgement
  }
  evidence.status = blockingControls(evidence.controls).length ? 'blocked' : 'ok'
  evidence.reportPath = context.statePath + '.report.json'
  state.lastCheck = {
    candidateFingerprint: candidate.fingerprint,
    evidence
  }
  writeState(context, state)
  fs.writeFileSync(evidence.reportPath, JSON.stringify(evidence, null, 2) + '\n')
  return evidence
}

// Trust is shared by every worktree of one repository, so it keys on the common Git directory.
function repositoryIdentity(root) {
  const common = path.resolve(root, runGit(root, ['rev-parse', '--git-common-dir']).trim())
  let real = common
  try {
    real = fs.realpathSync(common)
  } catch {
    // Keep the resolved path when the directory cannot be canonicalized.
  }
  return normalizePath(real)
}

export function controlsTrustPlan(cwd = process.cwd()) {
  const root = path.resolve(runGit(path.resolve(cwd), ['rev-parse', '--show-toplevel']).trim())
  const policy = readPolicy(root)
  return {
    root,
    repository: repositoryIdentity(root),
    signature: controlSignature(root, policy),
    checks: policy.checks.map(entry => ({ id: entry.id, command: entry.command, required: entry.required === true })),
    protectedFiles: policy.protectedFiles
  }
}

export function trustControls(plan, { trustStore = DEFAULT_TRUST_STORE } = {}) {
  recordControlsTrust(plan.repository, plan.signature, plan.checks, trustStore)
  return { trustStore, trusted: plan.checks.length }
}

export function clear(cwd = process.cwd(), { env = process.env } = {}) {
  const context = repositoryContext(cwd, env)
  const state = readState(context)
  if (state?.entry.controlSignature && prepareControls(context.root, snapshot(context.root).files, env).signature !== state.entry.controlSignature) {
    error('Quality policy changed. Restore it or acknowledge the authorized change with check --accept-policy-change <reason> before abandoning this baseline.', 'POLICY_CHANGED')
  }
  if (fs.existsSync(context.statePath)) fs.rmSync(context.statePath, { force: true })
  return { statePath: context.statePath, cleared: true }
}

// Closes a delivered attempt: it records a fresh check and removes the baseline only when that
// check passes. A blocked check keeps the baseline so delivery stays blocked.
export function finish(cwd = process.cwd(), options = {}) {
  const evidence = check(cwd, options)
  const context = repositoryContext(cwd, options.env ?? process.env)
  if (evidence.status !== 'ok') return { evidence, statePath: context.statePath, closed: false }
  fs.rmSync(context.statePath, { force: true })
  return { evidence, statePath: context.statePath, closed: true }
}

function allowResult() {
  return {}
}

function blockResult(reason) {
  return { decision: 'block', reason }
}

// Every Stop block is bounded. A check can stay stale or a required control can keep failing for
// reasons the agent cannot fix (a missing tool, a flaky dependency, a failing runner), and the
// host's own continuation cap resets whenever the agent calls a tool. After repeated re-entered
// Stops on the same unchanged candidate, the hook hands the decision to the user instead of
// looping. The baseline stays active, so `finish` still refuses delivery until a passing check.
function boundedBlockResult(context, state, kind, fingerprint, reason, releaseMessage, payload) {
  const key = `${kind}:${fingerprint}`
  const released = state.stopRelease?.key === key
  const count = state.stopBlocks?.key === key ? state.stopBlocks.count + 1 : 1
  if (released || (payload?.stop_hook_active === true && count > STOP_BLOCK_LIMIT)) {
    if (!released) {
      state.stopRelease = { key }
      writeState(context, state)
    }
    return { systemMessage: `${releaseMessage} Stopping is allowed so you can decide how to proceed; the baseline stays active and delivery stays blocked until a passing check.` }
  }
  state.stopBlocks = { key, count }
  writeState(context, state)
  return blockResult(reason)
}

function lifecycleCommand(command) {
  return `"${process.execPath}" "${fileURLToPath(import.meta.url)}" ${command}`
}

// A developer pastes this into their own terminal, so it names the worktree and, on Windows, uses
// the PowerShell call operator that a quoted executable path needs.
function developerTrustCommand(root) {
  const command = `${lifecycleCommand('trust')} --root "${root}"`
  return process.platform === 'win32' ? `& ${command}` : command
}

export function hook(cwd = process.cwd(), payload = {}, { env = process.env } = {}) {
  let context
  try {
    context = repositoryContext(cwd, hookSessionEnvironment(payload, env))
  } catch {
    return allowResult()
  }
  if (!fs.existsSync(context.statePath)) return allowResult()

  try {
    const state = readState(context)
    if (!state) return allowResult()
    let candidate
    try {
      candidate = candidateSnapshot(context.root, state.entry, { includeFiles: false })
    } catch (cause) {
      return boundedBlockResult(context, state, 'inspect', 'uninspectable',
        `Quality ratchet could not inspect the candidate: ${cause.message}. Run the quality-ratchet check and retry.`,
        `Quality ratchet still cannot inspect the candidate: ${cause.message}.`, payload)
    }
    // An inspection failure has no candidate fingerprint, so its bound resets once inspection works.
    if ([state.stopRelease?.key, state.stopBlocks?.key].some((key) => key?.startsWith('inspect:'))) {
      if (state.stopRelease?.key?.startsWith('inspect:')) delete state.stopRelease
      if (state.stopBlocks?.key?.startsWith('inspect:')) delete state.stopBlocks
      writeState(context, state)
    }
    const fresh = state.lastCheck?.candidateFingerprint === candidate.fingerprint
    if (fresh) {
      const controls = state.lastCheck.evidence?.controls
      const configured = fs.existsSync(path.join(context.root, POLICY_PATH)) || controls?.results?.length || controls?.policyChanged
      if (configured) {
        const prepared = prepareControls(context.root, snapshot(context.root).files, env)
        if (!controls || prepared.fingerprint !== controls.fingerprint) {
          return boundedBlockResult(context, state, 'controls-stale', candidate.fingerprint,
            `Project control evidence is stale. Run \`${lifecycleCommand('check')}\` before stopping.`,
            'Quality ratchet: project control evidence is still stale for the unchanged candidate.', payload)
        }
      }
      const blockers = blockingControls(controls)
      // The agent cannot resolve untrusted controls, so blocking would only spend continuations.
      if (controls?.untrusted && blockers.length === 1) {
        return {
          systemMessage: 'Quality ratchet: this repository declares project controls that are not trusted on this machine, so none ran: ' +
            controls.untrusted.commands.map((entry) => `${entry.id} ${JSON.stringify(entry.command)}`).join('; ') +
            `. To review and trust them, run in a terminal: ${controls.untrusted.trustCommand}. Delivery stays blocked until then.`
        }
      }
      if (blockers.length) {
        const summary = blockers.slice(0, 5).join('; ')
        return boundedBlockResult(context, state, 'controls', candidate.fingerprint,
          `Project controls block delivery: ${summary}. Fix the reported problem; do not rerun unchanged failing checks. If it cannot be fixed in this session, report the blocker and stop.`,
          `Quality ratchet: required project controls still fail for the unchanged candidate: ${summary}.`, payload)
      }
      // A passing check keeps the baseline: a turn can end mid-delivery to ask the developer, and
      // the next turn still compares against the exact entry state. `finish` or `clear` ends it.
      return allowResult()
    }
    const missing = state.lastCheck ? 'is stale for the current candidate' : 'has not run for this candidate'
    return boundedBlockResult(context, state, 'stale', candidate.fingerprint,
      `Quality ratchet check ${missing}. Run \`${lifecycleCommand('check')}\` before stopping, also when you only pause to ask the developer; the baseline stays active across turns.`,
      `Quality ratchet: the check ${missing} after repeated Stop blocks.`, payload)
  } catch (cause) {
    const reason = cause instanceof QualityRatchetError
      ? cause.message
      : `Quality ratchet lifecycle error: ${cause.message}`
    return blockResult(reason)
  }
}

function humanList(values) {
  return values.length ? values.join(', ') : 'none'
}

function complexityLines(complexity) {
  if (!complexity) return []
  if (complexity.status !== 'available') return [`Complexity: unavailable (${complexity.reason})`]
  return [
    `Complexity (touched functions): ${complexity.increased} increased, ${complexity.added} new, ${complexity.decreased} decreased or removed; max ${complexity.maxAfter}`,
    ...complexity.functions.slice(0, 10).map((fn) => `  ${fn.path}:${fn.line} ${fn.function}: ${fn.before ?? 'new'} -> ${fn.after}`),
    ...(complexity.beforeUnavailable.length ? [`  before unavailable (dirty at begin): ${humanList(complexity.beforeUnavailable)}`] : [])
  ]
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
    ...complexityLines(evidence.complexity),
    `Candidate fingerprint: ${evidence.candidateFingerprint}`,
    ...(evidence.controls ? [
      `Project controls: ${evidence.status}; ${evidence.controls.results.length} checks; ${evidence.controls.signals.length} new advisory/required signals`,
      ...evidence.controls.results.filter(result => result.status !== 'passed').map(result => `  ${result.id}: ${result.status} ${result.detail || result.output?.slice(0, 500) || ''}`),
      ...evidence.controls.signals.filter(signal => !signal.required).slice(0, 5).map(signal => `  advisory: ${signal.path}:${signal.line} ${signal.rule}: ${signal.text}`),
      ...blockingControls(evidence.controls).slice(0, 5).map(reason => `  blocked: ${reason}`),
      ...(evidence.controls.untrusted ? [
        '  Untrusted repository commands that were not run:',
        ...evidence.controls.untrusted.commands.map(entry => `    ${entry.id}: ${JSON.stringify(entry.command)}`),
        `  The developer reviews and trusts them by running this in an interactive terminal: ${evidence.controls.untrusted.trustCommand}`
      ] : []),
      `Full report: ${evidence.reportPath}; use --json for structured output.`
    ] : [])
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
    } else if (argument === '--accept-policy-change') {
      const reason = args[++index]
      if (!['check', 'finish'].includes(result.command) || !reason?.trim() || reason.startsWith('--')) error('--accept-policy-change requires check or finish and a reason.', 'ARGUMENTS')
      result.acceptPolicyChange = reason
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
  if (!['begin', 'check', 'finish', 'clear', 'trust', 'hook'].includes(result.command)) {
    error(`Unknown command "${result.command}". Use begin, check, finish, clear, trust, or hook.`, 'ARGUMENTS')
  }
  return result
}

// Trust is the developer's decision, so it needs an interactive terminal. An agent's shell tool has
// no TTY; this is a speed bump and a visible prompt, not a tamper-proof boundary.
async function runTrust(root, { input = process.stdin, output = process.stdout } = {}) {
  const plan = controlsTrustPlan(root)
  if (!plan.checks.length) {
    output.write(`No project controls are declared in ${POLICY_PATH}.\n`)
    return
  }
  output.write(`Repository: ${plan.root}\nCommands declared in ${POLICY_PATH}:\n`)
  for (const entry of plan.checks) output.write(`  ${entry.id}${entry.required ? ' (required)' : ''}: ${JSON.stringify(entry.command)}\n`)
  if (plan.protectedFiles.length) output.write(`Protected files: ${plan.protectedFiles.join(', ')}\n`)
  if (!input.isTTY || !output.isTTY) {
    error('trust must be run by the developer in an interactive terminal; an agent must not run it.', 'TRUST_INTERACTIVE')
  }
  const readline = await import('node:readline/promises')
  const prompt = readline.createInterface({ input, output })
  try {
    const answer = (await prompt.question('Run these commands during quality-ratchet check on this machine? [y/N] ')).trim().toLowerCase()
    if (answer !== 'y' && answer !== 'yes') {
      output.write('Not trusted. check will keep reporting these controls as untrusted.\n')
      return
    }
  } finally {
    prompt.close()
  }
  const result = trustControls(plan)
  output.write(`Trusted ${result.trusted} commands for this repository in ${result.trustStore}. Changing ${POLICY_PATH} or a protected file requires trusting again.\n`)
}

function readHookPayload() {
  try {
    const input = fs.readFileSync(0, 'utf8').trim()
    return input ? JSON.parse(input) : {}
  } catch {
    return {}
  }
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.command === 'trust') {
      await runTrust(options.root)
      return
    }
    if (options.command === 'begin') {
      const result = begin(options.root)
      console.log(`Quality ratchet baseline started for ${result.fileCount} files (${result.fingerprint}). State: ${result.statePath}`)
      return
    }
    if (options.command === 'check') {
      const evidence = check(options.root, { acceptPolicyChange: options.acceptPolicyChange })
      console.log(options.json ? JSON.stringify(evidence) : formatEvidence(evidence))
      if (evidence.status !== 'ok') process.exitCode = 1
      return
    }
    if (options.command === 'finish') {
      const result = finish(options.root, { acceptPolicyChange: options.acceptPolicyChange })
      console.log(options.json ? JSON.stringify(result) : [
        formatEvidence(result.evidence),
        result.closed
          ? `Quality ratchet baseline closed at ${result.statePath}.`
          : `Quality ratchet check is ${result.evidence.status}; the baseline stays active at ${result.statePath}.`
      ].join('\n'))
      if (!result.closed) process.exitCode = 1
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
  } catch (cause) {
    console.error(`quality-ratchet: ${cause.message}`)
    process.exitCode = cause instanceof QualityRatchetError && ['ARGUMENTS', 'TRUST_INTERACTIVE'].includes(cause.code) ? 2 : 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
