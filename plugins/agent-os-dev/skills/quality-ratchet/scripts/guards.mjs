#!/usr/bin/env node
// Agent OS guard hooks. Reads .agent-os/guards.json, Git, and intent files; never runs a command the
// repository declares. Without guards.json every hook is a no-op.
//
//   node guards.mjs hook --agent-os-hook=guards   SessionStart context or PreToolUse blocks (stdin payload)
//   node guards.mjs lock-test <path> [--root <dir>]
//   node guards.mjs unlock-test <path> [--root <dir>]
//   node guards.mjs status [--root <dir>]

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { listIntents, parseFrontmatter, parseUnits, staleness } from './intent-files.mjs'
import { deliveryBaselineActive } from './quality-delta.mjs'

export const GUARDS_HOOK_MARKER = '--agent-os-hook=guards'
export const GUARDS_PATH = '.agent-os/guards.json'
export const LOCKS_FILE = 'agent-os-test-locks.json'
export const GUARDS_TIMEOUT_SECONDS = 10

const SECRET_PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['Stripe live key', /\b[rs]k_live_[A-Za-z0-9]{20,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['hard-coded credential', /\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i]
]
const PLACEHOLDER = /(?:example|changeme|placeholder|dummy|sample|xxxx|<[^>]*>|\$\{|process\.env|os\.environ|getenv)/i

export class GuardsError extends Error {}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  return result.status === 0 ? result.stdout : null
}

export function repositoryRoot(cwd) {
  const top = git(path.resolve(cwd), ['rev-parse', '--show-toplevel'])
  return top ? path.resolve(top.trim()) : null
}

function gitDir(root) {
  const value = git(root, ['rev-parse', '--git-dir'])?.trim()
  if (!value) return null
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(root, value)
}

export function readGuards(root) {
  const file = path.join(root, GUARDS_PATH)
  if (!fs.existsSync(file)) return null
  let value
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (cause) {
    throw new GuardsError(`${GUARDS_PATH} is not valid JSON: ${cause.message}`)
  }
  const list = (key) => (Array.isArray(value?.[key]) ? value[key].filter((item) => typeof item === 'string') : [])
  return {
    protectedPaths: list('protectedPaths'),
    frozen: Array.isArray(value?.frozen) ? list('frozen') : ['intents/*/intent.md', 'intents/*/spec.md', 'intents/*/plan.md'],
    secretScan: value?.secretScan === true
  }
}

export function globToRegExp(glob) {
  let pattern = ''
  const text = glob.replaceAll('\\', '/').replace(/^\.\//, '')
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '*' && text[index + 1] === '*') {
      if (text[index + 2] === '/') {
        pattern += '(?:.*/)?'
        index += 2
      } else {
        pattern += '.*'
        index += 1
      }
    } else if (char === '*') pattern += '[^/]*'
    else if (char === '?') pattern += '[^/]'
    else pattern += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${pattern}$`)
}

// Windows and macOS file systems ignore case by default, so `Migrations/1.sql` is the same file.
const caseInsensitive = ['win32', 'darwin'].includes(process.platform)
const comparable = (value) => (caseInsensitive ? value.toLowerCase() : value)

export function matchesAny(relative, globs) {
  return globs.find((glob) => globToRegExp(comparable(glob)).test(comparable(relative))) ?? null
}

function relativeTo(root, cwd, file) {
  const absolute = path.resolve(cwd, file)
  const relative = path.relative(root, absolute)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null
  return relative.split(path.sep).join('/')
}

function commandText(input) {
  const command = input?.command ?? input?.cmd
  if (Array.isArray(command)) return command.join(' ')
  return typeof command === 'string' ? command : ''
}

// File targets of an edit: Claude tool inputs carry a path; Codex apply_patch carries patch headers.
export function editedPaths(payload) {
  const input = payload?.tool_input ?? {}
  const paths = []
  for (const key of ['file_path', 'path', 'notebook_path']) {
    if (typeof input[key] === 'string' && input[key]) paths.push(input[key])
  }
  const texts = [input.patch, input.input, commandText(input)].filter((value) => typeof value === 'string')
  for (const text of texts) {
    if (!text.includes('*** Begin Patch')) continue
    for (const match of text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)) {
      paths.push((match[1] ?? match[2]).trim())
    }
  }
  return [...new Set(paths)]
}

export function isGitCommit(payload) {
  return /(?:^|[;&|(]\s*|\s)git(?:\s+-C\s+\S+)?\s+commit\b/.test(commandText(payload?.tool_input))
}

// The hook runs before the command, so a `git add` in the same command has not staged anything yet.
function stagesInCommand(payload) {
  return /(?:^|[;&|(]\s*|\s)git(?:\s+-C\s+\S+)?\s+(?:add|stage)\b/.test(commandText(payload?.tool_input))
}

// Untracked files read as additions so a secret in a file the same command stages is still found.
function untrackedAsDiff(root) {
  const listed = git(root, ['ls-files', '--others', '--exclude-standard', '-z']) ?? ''
  const parts = []
  for (const relative of listed.split('\0').filter(Boolean).slice(0, 500)) {
    let content
    try {
      const file = path.join(root, relative)
      if (fs.statSync(file).size > 1024 * 1024) continue
      content = fs.readFileSync(file)
    } catch {
      continue
    }
    if (content.includes(0)) continue
    const lines = content.toString('utf8').replace(/\r\n/g, '\n').split('\n')
    parts.push(`+++ b/${relative}`, `@@ -0,0 +1,${lines.length} @@`, ...lines.map((line) => `+${line}`))
  }
  return parts.join('\n')
}

function readLocks(root) {
  const dir = gitDir(root)
  if (!dir) return { file: null, locks: [] }
  const file = path.join(dir, LOCKS_FILE)
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'))
    return { file, locks: Array.isArray(value?.locks) ? value.locks.filter((item) => typeof item === 'string') : [] }
  } catch {
    return { file, locks: [] }
  }
}

function writeLocks(file, locks) {
  fs.writeFileSync(file, JSON.stringify({ schema: 1, locks: [...new Set(locks)].sort() }, null, 2) + '\n')
}

export function lockTest(root, file, { lock = true, cwd = process.cwd() } = {}) {
  const relative = relativeTo(root, cwd, file)
  if (!relative) throw new GuardsError(`${file} is not inside ${root}`)
  if (lock && !fs.existsSync(path.join(root, relative))) throw new GuardsError(`${relative} does not exist`)
  const { file: store, locks } = readLocks(root)
  if (!store) throw new GuardsError(`${root} is not a Git worktree`)
  const next = lock ? [...locks, relative] : locks.filter((item) => item !== relative)
  writeLocks(store, next)
  return { relative, locks: [...new Set(next)].sort() }
}

function fileStatus(root, relative) {
  try {
    return parseFrontmatter(fs.readFileSync(path.join(root, relative), 'utf8'))?.data?.status ?? null
  } catch {
    return null
  }
}

export function scanSecrets(diff) {
  const findings = []
  let file = null
  let line = 0
  for (const text of String(diff).split('\n')) {
    if (text.startsWith('+++ ')) {
      file = text.slice(4).replace(/^b\//, '')
      continue
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(text)
    if (hunk) {
      line = Number(hunk[1])
      continue
    }
    if (text.startsWith('+') && !text.startsWith('+++')) {
      const added = text.slice(1)
      for (const [label, pattern] of SECRET_PATTERNS) {
        const match = pattern.exec(added)
        if (match && !PLACEHOLDER.test(match[0])) {
          findings.push({ file, line, label })
          break
        }
      }
      line += 1
    } else if (!text.startsWith('-')) {
      line += 1
    }
  }
  return findings
}

const allow = () => ({ exitCode: 0, stdout: '', stderr: '' })
const block = (message) => ({ exitCode: 2, stdout: '', stderr: `Agent OS guard: ${message}\n` })

// Claude asks the developer; Codex has no ask decision, so it blocks with the same instruction.
function ask(payload, message) {
  const codex = typeof payload?.turn_id === 'string' && payload.turn_id.trim()
  if (codex) return block(`${message} Ask the developer; they can make this edit themselves or remove the path from ${GUARDS_PATH}.`)
  return {
    exitCode: 0,
    stdout: JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: `Agent OS guard: ${message}` }
    }) + '\n',
    stderr: ''
  }
}

export function preToolUse(root, guards, payload, { env = process.env, cwd = root } = {}) {
  const paths = editedPaths(payload).map((file) => relativeTo(root, cwd, file)).filter(Boolean)
  const { locks } = readLocks(root)
  const delivering = paths.length > 0 && deliveryBaselineActive(cwd, payload, { env })
  for (const relative of paths) {
    if (locks.some((lock) => comparable(lock) === comparable(relative))) {
      return block(`${relative} is a locked failing test. Fix the code until it passes; changing the test needs the developer's explicit agreement and \`guards.mjs unlock-test ${relative}\`.`)
    }
    if (delivering && matchesAny(relative, guards.frozen) && fileStatus(root, relative) === 'accepted') {
      return block(`${relative} is accepted and delivery never edits it. A needed change goes back through plan-work or shape-work in its own review.`)
    }
  }
  for (const relative of paths) {
    const glob = matchesAny(relative, guards.protectedPaths)
    if (glob) return ask(payload, `${relative} is protected by "${glob}" in ${GUARDS_PATH}.`)
  }
  if (guards.secretScan && isGitCommit(payload)) {
    const all = /\scommit\b[^;&|]*\s(?:-a|--all|-[A-Za-z]*a[A-Za-z]*)\b/.test(commandText(payload.tool_input))
    const staging = stagesInCommand(payload)
    // With HEAD missing in a new repository, the index diff is still the best available view.
    const tracked = git(root, all || staging ? ['diff', 'HEAD', '-U0', '--no-color'] : ['diff', '--cached', '-U0', '--no-color']) ??
      git(root, ['diff', '--cached', '-U0', '--no-color'])
    const diff = [tracked ?? '', staging ? untrackedAsDiff(root) : ''].join('\n')
    const findings = scanSecrets(diff)
    if (findings.length) {
      const list = findings.slice(0, 5).map((item) => `${item.file}:${item.line} (${item.label})`).join(', ')
      return block(`the commit adds what looks like a secret: ${list}. Remove it and load it from the environment instead; a false positive is the developer's call.`)
    }
  }
  return allow()
}

function currentBranch(root) {
  return git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])?.trim() ?? ''
}

export function sessionContext(root) {
  const folders = listIntents(root)
  if (!folders.length) return ''
  const branch = currentBranch(root)
  const lines = []
  for (const folder of folders) {
    const units = parseUnits(folder.files['plan.md']?.body ?? '') ?? []
    const unit = units.find((item) => branch.includes(item.key) && (branch.includes(folder.id) || !/^U\d+$/.test(item.key)))
    if (!unit && !branch.includes(folder.id)) continue
    const spec = folder.files['spec.md']?.data
    lines.push(`Branch ${branch} belongs to intent ${folder.id}` +
      (unit ? `, unit ${unit.key} "${unit.title}"` : '') +
      (spec ? ` (spec rev ${spec.rev ?? '?'})` : ' (no spec yet)') + '.')
  }
  const stale = folders.flatMap((folder) => staleness(folder))
  for (const item of stale.slice(0, 5)) {
    lines.push(`Stale: ${item.file} is built on ${item.kind}@${item.builtOn}, but ${item.kind}.md is at rev ${item.current}; reconsider it before delivering from it.`)
  }
  const { locks } = readLocks(root)
  if (locks.length) lines.push(`Locked failing tests: ${locks.join(', ')}.`)
  return lines.length ? `Agent OS context:\n- ${lines.join('\n- ')}\n` : ''
}

export function hook(cwd, payload = {}, { env = process.env } = {}) {
  const event = payload?.hook_event_name
  // Most tool calls are neither edits nor commits; answer them before touching Git.
  if (event === 'PreToolUse' && editedPaths(payload).length === 0 && !isGitCommit(payload)) return allow()
  const root = repositoryRoot(payload?.cwd || cwd)
  if (!root) return allow()
  let guards
  try {
    guards = readGuards(root)
  } catch (cause) {
    if (event !== 'PreToolUse') return allow()
    // Never block the one edit that repairs the configuration.
    const targets = editedPaths(payload).map((file) => relativeTo(root, payload?.cwd || cwd, file))
    if (targets.length && targets.every((target) => target === GUARDS_PATH)) return allow()
    return block(`${cause.message}. Fix ${GUARDS_PATH} first; edits to it are allowed.`)
  }
  if (!guards) return allow()
  if (event === 'SessionStart') {
    return { exitCode: 0, stdout: sessionContext(root), stderr: '' }
  }
  if (event === 'PreToolUse') return preToolUse(root, guards, payload, { env, cwd: payload?.cwd || cwd })
  return allow()
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function option(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function main(argv = process.argv.slice(2)) {
  const [command, target] = argv
  try {
    if (command === 'hook') {
      let payload = {}
      try {
        payload = JSON.parse(readStdin() || '{}')
      } catch {
        payload = {}
      }
      const result = hook(process.cwd(), payload)
      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
      process.exitCode = result.exitCode
      return
    }
    const root = repositoryRoot(option(argv, '--root') || process.cwd())
    if (!root) throw new GuardsError('not inside a Git worktree')
    if (command === 'lock-test' || command === 'unlock-test') {
      if (!target || target.startsWith('--')) throw new GuardsError(`${command} needs a test path`)
      const result = lockTest(root, target, { lock: command === 'lock-test' })
      console.log(`${command === 'lock-test' ? 'Locked' : 'Unlocked'} ${result.relative}. Locked tests: ${result.locks.join(', ') || 'none'}.`)
      return
    }
    if (command === 'status') {
      const guards = readGuards(root)
      console.log(guards ? `Guards active from ${GUARDS_PATH}.` : `No ${GUARDS_PATH}; guard hooks do nothing here.`)
      process.stdout.write(sessionContext(root))
      return
    }
    throw new GuardsError('Use hook, lock-test <path>, unlock-test <path>, or status.')
  } catch (cause) {
    console.error(`guards: ${cause.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
