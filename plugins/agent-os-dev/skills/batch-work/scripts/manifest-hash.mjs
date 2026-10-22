#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export const planFields = [
  'baseline_sha',
  'integration_branch',
  'max_workers',
  'retry_limit',
  'integration_strategy',
  'aggregate_checks'
]

export const taskFields = [
  'task_key',
  'source',
  'dependencies',
  'scope',
  'outcome',
  'non_goals',
  'checks',
  'task_hash'
]

export const runtimeFields = [
  'task_key',
  'state',
  'attempt',
  'branch',
  'worktree',
  'worker_id',
  'head_sha',
  'result'
]

const cursorFields = ['agent_os_batch', 'batch_id', 'status', 'next_action', 'manifest_hash']
const batchStates = ['planned', 'running', 'reconciling', 'verifying', 'ready', 'delivered', 'blocked']
const taskStates = ['pending', 'ready', 'running', 'succeeded', 'integrated', 'failed', 'blocked', 'conflict']

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n') : value
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}

function exactFields(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields must be exactly: ${expected.join(', ')}`)
  }
}

function string(value, label, { empty = false } = {}) {
  if (typeof value !== 'string' || (!empty && !value.trim())) throw new Error(`${label} must be a ${empty ? '' : 'non-empty '}string`)
}

function strings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label} must be an array of non-empty strings`)
  }
}

function unquote(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1)
  return trimmed
}

export function parseCursor(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) throw new Error('manifest must start with YAML frontmatter')
  const cursor = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) throw new Error(`invalid cursor line: ${line}`)
    const key = line.slice(0, separator).trim()
    if (key in cursor) throw new Error(`duplicate cursor field: ${key}`)
    cursor[key] = unquote(line.slice(separator + 1))
  }
  exactFields(cursor, cursorFields, 'cursor')
  if (cursor.agent_os_batch !== '2') throw new Error('agent_os_batch must be 2')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cursor.batch_id)) throw new Error('batch_id must be kebab-case')
  if (!batchStates.includes(cursor.status)) throw new Error(`invalid batch status: ${cursor.status}`)
  if (cursor.status !== 'delivered') string(cursor.next_action, 'next_action')
  string(cursor.manifest_hash, 'manifest_hash', { empty: true })
  return cursor
}

function blocks(content) {
  const found = { plan: [], task: [], runtime: [] }
  for (const match of content.matchAll(/```json batch-(plan|task|runtime)\r?\n([\s\S]*?)\r?\n```/g)) {
    try {
      found[match[1]].push(JSON.parse(match[2]))
    } catch (error) {
      throw new Error(`invalid batch-${match[1]} JSON: ${error.message}`)
    }
  }
  return found
}

export function parsePlan(value) {
  exactFields(value, planFields, 'batch plan')
  string(value.baseline_sha, 'baseline_sha')
  string(value.integration_branch, 'integration_branch')
  if (!Number.isInteger(value.max_workers) || value.max_workers < 1) throw new Error('max_workers must be a positive integer')
  if (!Number.isInteger(value.retry_limit) || value.retry_limit < 0) throw new Error('retry_limit must be a non-negative integer')
  string(value.integration_strategy, 'integration_strategy')
  strings(value.aggregate_checks, 'aggregate_checks')
  return value
}

function parseTask(value) {
  exactFields(value, taskFields, `task ${value?.task_key ?? '<unknown>'}`)
  string(value.task_key, 'task_key')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.task_key)) throw new Error(`${value.task_key}: task_key must be kebab-case`)
  string(value.source, `${value.task_key}: source`)
  strings(value.dependencies, `${value.task_key}: dependencies`)
  strings(value.scope, `${value.task_key}: scope`)
  string(value.outcome, `${value.task_key}: outcome`)
  strings(value.non_goals, `${value.task_key}: non_goals`)
  strings(value.checks, `${value.task_key}: checks`)
  string(value.task_hash, `${value.task_key}: task_hash`, { empty: true })
  return value
}

function validateGraph(tasks) {
  const keys = new Set()
  for (const task of tasks) {
    if (keys.has(task.task_key)) throw new Error(`duplicate task_key: ${task.task_key}`)
    keys.add(task.task_key)
  }
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!keys.has(dependency)) throw new Error(`${task.task_key}: unknown dependency ${dependency}`)
      if (dependency === task.task_key) throw new Error(`${task.task_key}: self dependency`)
    }
  }
  const visiting = new Set()
  const visited = new Set()
  const byKey = new Map(tasks.map((task) => [task.task_key, task]))
  function visit(key) {
    if (visiting.has(key)) throw new Error(`dependency cycle at ${key}`)
    if (visited.has(key)) return
    visiting.add(key)
    for (const dependency of byKey.get(key).dependencies) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }
  for (const key of keys) visit(key)
}

function portable(value) {
  return !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.startsWith('\\\\')
}

function parseRuntime(value, tasks) {
  exactFields(value, ['tasks'], 'batch runtime')
  if (!Array.isArray(value.tasks)) throw new Error('batch runtime tasks must be an array')
  const definitions = new Map(tasks.map((task) => [task.task_key, task]))
  const seen = new Set()
  const states = new Map()
  for (const item of value.tasks) {
    exactFields(item, runtimeFields, `runtime ${item?.task_key ?? '<unknown>'}`)
    if (!definitions.has(item.task_key)) throw new Error(`runtime has unknown task ${item.task_key}`)
    if (seen.has(item.task_key)) throw new Error(`runtime duplicates task ${item.task_key}`)
    seen.add(item.task_key)
    if (!taskStates.includes(item.state)) throw new Error(`${item.task_key}: invalid runtime state ${item.state}`)
    if (!Number.isInteger(item.attempt) || item.attempt < 0) throw new Error(`${item.task_key}: attempt must be a non-negative integer`)
    for (const field of ['branch', 'worktree', 'worker_id', 'head_sha', 'result']) string(item[field], `${item.task_key}: ${field}`, { empty: true })
    if (item.worktree && !portable(item.worktree)) throw new Error(`${item.task_key}: worktree must be portable`)
    if (['ready', 'running'].includes(item.state) && (!item.attempt || !item.branch || !item.worktree)) {
      throw new Error(`${item.task_key}: active task requires attempt, branch, and worktree`)
    }
    if (item.state === 'running' && !item.worker_id) throw new Error(`${item.task_key}: running task requires worker_id`)
    if (['succeeded', 'integrated'].includes(item.state) && !item.head_sha) throw new Error(`${item.task_key}: completed task requires head_sha`)
    states.set(item.task_key, item.state)
  }
  if (seen.size !== tasks.length) throw new Error('runtime must contain exactly one entry per task')
  for (const item of value.tasks) {
    if (['ready', 'running', 'succeeded', 'integrated'].includes(item.state)) {
      for (const dependency of definitions.get(item.task_key).dependencies) {
        if (states.get(dependency) !== 'integrated') throw new Error(`${item.task_key}: dependency ${dependency} is not integrated`)
      }
    }
  }
  return value
}

export function parseManifest(content) {
  const cursor = parseCursor(content)
  const found = blocks(content)
  if (found.plan.length !== 1) throw new Error('manifest requires exactly one batch-plan block')
  if (!found.task.length) throw new Error('manifest requires at least one batch-task block')
  if (found.runtime.length !== 1) throw new Error('manifest requires exactly one batch-runtime block')
  const plan = parsePlan(found.plan[0])
  const tasks = found.task.map(parseTask)
  validateGraph(tasks)
  const runtime = parseRuntime(found.runtime[0], tasks)
  return { cursor, plan, tasks, runtime }
}

export function hashTask(task) {
  const definition = Object.fromEntries(taskFields.filter((field) => field !== 'task_hash').map((field) => [field, task[field]]))
  return digest(definition)
}

export function hashManifest(batchId, plan, tasks) {
  return digest({
    batch_id: batchId,
    plan,
    tasks: tasks.map((task) => [task.task_key, hashTask(task)]).sort(([left], [right]) => left.localeCompare(right))
  })
}

export function checkManifest(content) {
  const parsed = parseManifest(content)
  const taskHashes = Object.fromEntries(parsed.tasks.map((task) => [task.task_key, hashTask(task)]))
  const manifestHash = hashManifest(parsed.cursor.batch_id, parsed.plan, parsed.tasks)
  const mismatches = []
  for (const task of parsed.tasks) {
    if (task.task_hash !== taskHashes[task.task_key]) mismatches.push(`${task.task_key}: task_hash mismatch`)
  }
  if (parsed.cursor.manifest_hash !== manifestHash) mismatches.push('manifest_hash mismatch')
  return { ...parsed, calculated: { task_hashes: taskHashes, manifest_hash: manifestHash }, mismatches }
}

function main() {
  const args = process.argv.slice(2)
  const check = args[0] === '--check'
  const file = check ? args[1] : args[0]
  if (!file || args.length !== (check ? 2 : 1)) {
    console.error('Usage: manifest-hash.mjs [--check] <manifest.md>')
    process.exitCode = 2
    return
  }
  try {
    const result = checkManifest(fs.readFileSync(file, 'utf8'))
    if (check && result.mismatches.length) {
      for (const mismatch of result.mismatches) console.error(mismatch)
      process.exitCode = 1
      return
    }
    console.log(JSON.stringify(result.calculated, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
