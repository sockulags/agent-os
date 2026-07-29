#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export const definitionFields = [
  'task_key',
  'source',
  'dependencies',
  'owned_scope',
  'goal',
  'non_goals',
  'acceptance',
  'verification',
  'mutation_authority',
  'external_side_effect_authority',
  'delivery_boundary'
]

export const planFields = [
  'baseline_sha',
  'integration_branch',
  'max_mutating_workers',
  'retry_limit',
  'integration_strategy',
  'aggregate_verification',
  'pr_authority',
  'merge_authority',
  'cleanup_authority'
]

export const runtimeFields = [
  'task_key',
  'task_hash',
  'approved_manifest_hash',
  'state',
  'state_reason',
  'active_attempt',
  'branch_key',
  'worktree_key',
  'baseline_sha',
  'worker_id',
  'dispatch_time',
  'receipts',
  'rejected_receipts'
]

export const receiptFields = [
  'batch_id',
  'task_key',
  'task_hash',
  'approved_manifest_hash',
  'attempt',
  'worker',
  'baseline_sha',
  'head_sha',
  'changed_files',
  'acceptance_evidence',
  'commands_and_results',
  'review_result',
  'external_side_effects',
  'remaining_uncertainty'
]

const forwardStatuses = [
  'awaiting-approval',
  'approved',
  'running',
  'reconciling',
  'verifying',
  'ready-to-deliver',
  'delivered'
]

function normalize(value) {
  if (typeof value === 'string') return value.replace(/\r\n/g, '\n')
  if (Array.isArray(value)) return value.map(normalize)
  return value
}

function digest(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex')
}

function nonEmptyStringArray(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && !value.length) ||
      value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`${label} must ${allowEmpty ? 'contain only' : 'contain'} non-empty strings`)
  }
}

function parseScalar(raw, key) {
  const value = raw.trim()
  if (!value.startsWith('"')) return value
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== 'string') throw new Error()
    return parsed
  } catch {
    throw new Error(`frontmatter ${key} must be a plain or JSON-quoted scalar`)
  }
}

export function parseCursor(content) {
  const normalized = content.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) throw new Error('manifest must start with YAML frontmatter')
  const closing = normalized.indexOf('\n---\n', 4)
  if (closing < 0) throw new Error('manifest frontmatter is not closed')
  const allowed = new Set([
    'agent_os_batch',
    'batch_id',
    'status',
    'next_action',
    'manifest_hash',
    'approved_manifest_hash',
    'blocked_from',
    'blocked_reason'
  ])
  const cursor = {}
  for (const line of normalized.slice(4, closing).split('\n')) {
    if (!line.trim()) continue
    const match = line.match(/^([a-z_]+):\s*(.*)$/)
    if (!match) throw new Error(`unsupported frontmatter line: ${line}`)
    const [, key, raw] = match
    if (!allowed.has(key)) throw new Error(`unknown frontmatter field: ${key}`)
    if (key in cursor) throw new Error(`duplicate frontmatter field: ${key}`)
    cursor[key] = parseScalar(raw, key)
  }
  for (const key of ['agent_os_batch', 'batch_id', 'status', 'next_action', 'manifest_hash', 'approved_manifest_hash']) {
    if (!(key in cursor)) throw new Error(`missing frontmatter field: ${key}`)
  }
  if (cursor.agent_os_batch !== '1') throw new Error('agent_os_batch must be 1')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cursor.batch_id)) throw new Error('batch_id must be kebab-case')
  if (![...forwardStatuses, 'blocked'].includes(cursor.status)) {
    throw new Error(`unsupported batch status: ${cursor.status || '<missing>'}`)
  }
  if (cursor.status === 'delivered') {
    if (cursor.next_action.trim()) throw new Error('delivered manifest must clear next_action')
  } else if (!cursor.next_action.trim()) {
    throw new Error('active manifest requires next_action')
  }
  if (cursor.status === 'blocked') {
    if (!cursor.blocked_from || !forwardStatuses.includes(cursor.blocked_from)) {
      throw new Error('blocked manifest requires a valid blocked_from')
    }
    if (!cursor.blocked_reason?.trim()) throw new Error('blocked manifest requires blocked_reason')
    if (!cursor.next_action.trim()) throw new Error('blocked manifest requires next_action')
  } else if ('blocked_from' in cursor || 'blocked_reason' in cursor) {
    throw new Error('blocked_from and blocked_reason are valid only when status is blocked')
  }
  return cursor
}

export function hashTask(task) {
  const allowedFields = new Set([...definitionFields, 'task_hash'])
  const extras = Object.keys(task).filter((field) => !allowedFields.has(field))
  if (extras.length) throw new Error(`${task.task_key ?? '<unknown>'}: unknown fields ${extras.join(', ')}`)
  const definition = {}
  for (const field of definitionFields) {
    if (!(field in task)) throw new Error(`${task.task_key ?? '<unknown>'}: missing ${field}`)
    definition[field] = normalize(task[field])
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.task_key)) {
    throw new Error(`${definition.task_key}: task_key must be kebab-case`)
  }
  if (!Array.isArray(definition.dependencies) || !Array.isArray(definition.owned_scope) ||
      !Array.isArray(definition.non_goals) || !Array.isArray(definition.acceptance) ||
      !Array.isArray(definition.verification)) {
    throw new Error(`${definition.task_key}: dependencies, owned_scope, non_goals, acceptance, and verification must be arrays`)
  }
  for (const field of ['dependencies', 'non_goals']) nonEmptyStringArray(definition[field], `${definition.task_key}: ${field}`)
  for (const field of ['owned_scope', 'acceptance', 'verification']) {
    nonEmptyStringArray(definition[field], `${definition.task_key}: ${field}`, { allowEmpty: false })
  }
  for (const field of ['source', 'goal', 'mutation_authority', 'external_side_effect_authority']) {
    if (typeof definition[field] !== 'string' || !definition[field].trim()) {
      throw new Error(`${definition.task_key}: ${field} must be a non-empty string`)
    }
  }
  if (!definition.owned_scope.length || !definition.acceptance.length || !definition.verification.length) {
    throw new Error(`${definition.task_key}: owned_scope, acceptance, and verification must not be empty`)
  }
  if (definition.delivery_boundary !== 'local commit + worker receipt') {
    throw new Error(`${definition.task_key}: unsupported delivery boundary`)
  }
  return digest(`${JSON.stringify(definition)}\n`)
}

export function parseManifest(content) {
  const tasks = [...content.matchAll(/```json batch-task\r?\n([\s\S]*?)\r?\n```/g)].map((match) => JSON.parse(match[1]))
  if (!tasks.length) throw new Error('manifest contains no json batch-task blocks')
  const keys = tasks.map((task) => task.task_key)
  if (new Set(keys).size !== keys.length) throw new Error('manifest contains duplicate task_key values')
  const known = new Set(keys)
  for (const task of tasks) {
    for (const dependency of task.dependencies ?? []) {
      if (!known.has(dependency)) throw new Error(`${task.task_key}: unknown dependency ${dependency}`)
      if (dependency === task.task_key) throw new Error(`${task.task_key}: task cannot depend on itself`)
    }
  }
  detectCycles(tasks)
  return tasks
}

export function parsePlan(content) {
  const matches = [...content.matchAll(/```json batch-plan\r?\n([\s\S]*?)\r?\n```/g)]
  if (matches.length !== 1) throw new Error('manifest must contain exactly one json batch-plan block')
  return canonicalizePlan(JSON.parse(matches[0][1]))
}

function canonicalizePlan(plan) {
  const extras = Object.keys(plan).filter((field) => !planFields.includes(field))
  if (extras.length) throw new Error(`batch plan: unknown fields ${extras.join(', ')}`)
  for (const field of planFields) {
    if (!(field in plan)) throw new Error(`batch plan: missing ${field}`)
  }
  for (const field of ['baseline_sha', 'integration_branch', 'integration_strategy', 'pr_authority', 'merge_authority', 'cleanup_authority']) {
    if (typeof plan[field] !== 'string' || !plan[field].trim()) throw new Error(`batch plan: ${field} must be a non-empty string`)
  }
  for (const field of ['max_mutating_workers', 'retry_limit']) {
    if (!Number.isInteger(plan[field]) || plan[field] < (field === 'max_mutating_workers' ? 1 : 0)) {
      throw new Error(`batch plan: ${field} must be a valid integer`)
    }
  }
  nonEmptyStringArray(plan.aggregate_verification, 'batch plan: aggregate_verification', { allowEmpty: false })
  const normalized = {}
  for (const field of planFields) normalized[field] = normalize(plan[field])
  return normalized
}

function validateReceiptShape(receipt, runtime) {
  const extras = Object.keys(receipt).filter((field) => !receiptFields.includes(field))
  if (extras.length) throw new Error(`${runtime.task_key} receipt: unknown fields ${extras.join(', ')}`)
  for (const field of receiptFields) {
    if (!(field in receipt)) throw new Error(`${runtime.task_key} receipt: missing ${field}`)
  }
  if (!Number.isInteger(receipt.attempt) || receipt.attempt < 1) {
    throw new Error(`${runtime.task_key} receipt: attempt must be a positive integer`)
  }
  for (const field of ['worker', 'head_sha', 'review_result']) {
    if (typeof receipt[field] !== 'string') throw new Error(`${runtime.task_key} receipt: ${field} must be a string`)
  }
  for (const field of ['changed_files', 'acceptance_evidence', 'commands_and_results', 'external_side_effects', 'remaining_uncertainty']) {
    nonEmptyStringArray(receipt[field], `${runtime.task_key} receipt: ${field}`)
  }
}

function receiptMismatches(receipt, runtime, batchId, plan) {
  validateReceiptShape(receipt, runtime)
  const mismatches = []
  if (receipt.batch_id !== batchId) mismatches.push('batch_id mismatch')
  if (receipt.task_key !== runtime.task_key) mismatches.push('task_key mismatch')
  if (receipt.task_hash !== runtime.task_hash) mismatches.push('task_hash mismatch')
  if (receipt.approved_manifest_hash !== runtime.approved_manifest_hash) {
    mismatches.push('approved_manifest_hash mismatch')
  }
  if (receipt.attempt !== runtime.active_attempt) mismatches.push('attempt mismatch')
  if (receipt.worker !== runtime.worker_id) mismatches.push('worker mismatch')
  if (receipt.baseline_sha !== plan.baseline_sha) mismatches.push('baseline_sha mismatch')
  return mismatches
}

export function parseRuntime(content, tasks, batchId, plan, cursor) {
  const matches = [...content.matchAll(/```json batch-runtime\r?\n([\s\S]*?)\r?\n```/g)]
  if (matches.length !== 1) throw new Error('manifest must contain exactly one json batch-runtime block')
  const root = JSON.parse(matches[0][1])
  if (Object.keys(root).length !== 1 || !Array.isArray(root.tasks)) {
    throw new Error('batch runtime root must contain only a tasks array')
  }
  if (root.tasks.length !== tasks.length) throw new Error('batch runtime must contain exactly one entry per task')
  const definitions = new Map(tasks.map((task) => [task.task_key, task]))
  const seen = new Set()
  for (const runtime of root.tasks) {
    const extras = Object.keys(runtime).filter((field) => !runtimeFields.includes(field))
    if (extras.length) throw new Error(`${runtime.task_key ?? '<unknown>'} runtime: unknown fields ${extras.join(', ')}`)
    for (const field of runtimeFields) {
      if (!(field in runtime)) throw new Error(`${runtime.task_key ?? '<unknown>'} runtime: missing ${field}`)
    }
    if (!definitions.has(runtime.task_key)) throw new Error(`runtime has unknown task_key ${runtime.task_key}`)
    if (seen.has(runtime.task_key)) throw new Error(`runtime has duplicate task_key ${runtime.task_key}`)
    seen.add(runtime.task_key)
    if (runtime.task_hash !== hashTask(definitions.get(runtime.task_key))) {
      throw new Error(`${runtime.task_key} runtime: task_hash mismatch`)
    }
    if (runtime.approved_manifest_hash !== cursor.approved_manifest_hash) {
      throw new Error(`${runtime.task_key} runtime: approved_manifest_hash mismatch`)
    }
    if (!['pending', 'ready', 'running', 'succeeded', 'integrated', 'failed', 'blocked', 'conflict'].includes(runtime.state)) {
      throw new Error(`${runtime.task_key} runtime: unsupported state`)
    }
    if (typeof runtime.state_reason !== 'string') throw new Error(`${runtime.task_key} runtime: state_reason must be a string`)
    if (!Number.isInteger(runtime.active_attempt) || runtime.active_attempt < 0) {
      throw new Error(`${runtime.task_key} runtime: active_attempt must be a non-negative integer`)
    }
    for (const field of ['branch_key', 'worktree_key', 'baseline_sha', 'worker_id', 'dispatch_time']) {
      if (typeof runtime[field] !== 'string') throw new Error(`${runtime.task_key} runtime: ${field} must be a string`)
    }
    if (runtime.baseline_sha !== plan.baseline_sha) throw new Error(`${runtime.task_key} runtime: baseline_sha mismatch`)
    if (!Array.isArray(runtime.receipts) || !Array.isArray(runtime.rejected_receipts)) {
      throw new Error(`${runtime.task_key} runtime: receipt collections must be arrays`)
    }
    if (runtime.state === 'pending' && runtime.active_attempt !== 0) {
      throw new Error(`${runtime.task_key} runtime: pending tasks use active_attempt 0`)
    }
    if (['ready', 'running', 'succeeded', 'integrated', 'failed'].includes(runtime.state) &&
        runtime.active_attempt < 1) {
      throw new Error(`${runtime.task_key} runtime: active state requires an attempt`)
    }
    if (['failed', 'blocked', 'conflict'].includes(runtime.state) && !runtime.state_reason.trim()) {
      throw new Error(`${runtime.task_key} runtime: side state requires state_reason`)
    }
    if (['ready', 'running', 'succeeded', 'integrated'].includes(runtime.state) &&
        (!runtime.branch_key.trim() || !runtime.worktree_key.trim())) {
      throw new Error(`${runtime.task_key} runtime: active workspace keys are required`)
    }
    if (runtime.state === 'running' && (!runtime.worker_id.trim() || !runtime.dispatch_time.trim())) {
      throw new Error(`${runtime.task_key} runtime: running state requires worker identity and dispatch time`)
    }
    if (/^(?:[a-zA-Z]:[\\/]|[/\\]{2}|\/)/.test(runtime.worktree_key)) {
      throw new Error(`${runtime.task_key} runtime: worktree_key must be portable, not absolute`)
    }
    const receiptAttempts = new Set()
    for (const receipt of runtime.receipts) {
      const mismatches = receiptMismatches(receipt, runtime, batchId, plan)
      if (mismatches.length) throw new Error(`${runtime.task_key} receipt: ${mismatches.join(', ')}`)
      if (receipt.attempt > runtime.active_attempt) {
        throw new Error(`${runtime.task_key} receipt: attempt exceeds active_attempt`)
      }
      if (receiptAttempts.has(receipt.attempt)) throw new Error(`${runtime.task_key} receipt: duplicate attempt`)
      receiptAttempts.add(receipt.attempt)
    }
    const rejectedAttempts = new Set()
    for (const rejected of runtime.rejected_receipts) {
      if (!rejected || Object.keys(rejected).some((field) => !['receipt', 'rejection_reasons'].includes(field)) ||
          !('receipt' in rejected) || !('rejection_reasons' in rejected)) {
        throw new Error(`${runtime.task_key} rejected receipt: requires only receipt and rejection_reasons`)
      }
      nonEmptyStringArray(rejected.rejection_reasons, `${runtime.task_key} rejected receipt: rejection_reasons`, { allowEmpty: false })
      const mismatches = receiptMismatches(rejected.receipt, runtime, batchId, plan)
      if (rejected.receipt.attempt > runtime.active_attempt) {
        throw new Error(`${runtime.task_key} rejected receipt: attempt exceeds active_attempt`)
      }
      if (rejectedAttempts.has(rejected.receipt.attempt)) {
        throw new Error(`${runtime.task_key} rejected receipt: duplicate attempt`)
      }
      rejectedAttempts.add(rejected.receipt.attempt)
      for (const mismatch of mismatches) {
        if (!rejected.rejection_reasons.includes(mismatch)) {
          throw new Error(`${runtime.task_key} rejected receipt: missing exact reason ${mismatch}`)
        }
      }
      const unsupportedReasons = rejected.rejection_reasons.filter((reason) =>
        !mismatches.includes(reason) && !/^semantic: \S/.test(reason))
      if (unsupportedReasons.length) {
        throw new Error(`${runtime.task_key} rejected receipt: unsupported reasons ${unsupportedReasons.join(', ')}`)
      }
      if (!mismatches.length && !rejected.rejection_reasons.some((reason) => /^semantic: \S/.test(reason))) {
        throw new Error(`${runtime.task_key} rejected receipt: requires a machine mismatch or semantic diagnostic`)
      }
      const historicalAttempt = rejected.receipt.attempt < runtime.active_attempt
      if (!historicalAttempt && runtime.state !== 'failed') {
        throw new Error(`${runtime.task_key} rejected receipt: current attempt requires failed state`)
      }
      if (!historicalAttempt &&
          rejected.rejection_reasons.some((reason) => !runtime.state_reason.includes(reason))) {
        throw new Error(`${runtime.task_key} rejected receipt: state_reason must retain every rejection reason`)
      }
    }
    if (['succeeded', 'integrated'].includes(runtime.state) &&
        !runtime.receipts.some((receipt) => receipt.attempt === runtime.active_attempt && receipt.head_sha.trim())) {
      throw new Error(`${runtime.task_key} runtime: successful state requires an active receipt with head_sha`)
    }
  }
  return root.tasks
}

function detectCycles(tasks) {
  const byKey = new Map(tasks.map((task) => [task.task_key, task]))
  const visiting = new Set()
  const visited = new Set()
  function visit(key) {
    if (visiting.has(key)) throw new Error(`dependency cycle includes ${key}`)
    if (visited.has(key)) return
    visiting.add(key)
    for (const dependency of byKey.get(key).dependencies) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }
  for (const key of byKey.keys()) visit(key)
}

export function hashManifest(tasks, batchId, plan) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(batchId ?? '')) {
    throw new Error('batch_id must be kebab-case')
  }
  if (!plan) throw new Error('batch plan is required')
  const canonicalPlan = canonicalizePlan(plan)
  const taskHashes = tasks
    .map((task) => ({ task_key: task.task_key, task_hash: hashTask(task) }))
    .sort((left, right) => left.task_key < right.task_key ? -1 : left.task_key > right.task_key ? 1 : 0)
  const aggregate = digest(`${JSON.stringify({
    batch_id: batchId,
    plan: canonicalPlan,
    tasks: taskHashes
  })}\n`)
  return { task_hashes: taskHashes, manifest_hash: aggregate }
}

export function checkManifest(content) {
  const cursor = parseCursor(content)
  const tasks = parseManifest(content)
  const plan = parsePlan(content)
  const calculated = hashManifest(tasks, cursor.batch_id, plan)
  parseRuntime(content, tasks, cursor.batch_id, plan, cursor)
  const recordedManifest = cursor.manifest_hash
  const recordedApproval = cursor.approved_manifest_hash
  const mismatches = []
  for (const calculatedTask of calculated.task_hashes) {
    const task = tasks.find((candidate) => candidate.task_key === calculatedTask.task_key)
    if (task.task_hash !== calculatedTask.task_hash) {
      mismatches.push(`${task.task_key}: task_hash mismatch`)
    }
  }
  if (recordedManifest !== calculated.manifest_hash) {
    mismatches.push('manifest_hash mismatch')
  }
  const beforeApproval = cursor.status === 'awaiting-approval' ||
    (cursor.status === 'blocked' && cursor.blocked_from === 'awaiting-approval')
  if (beforeApproval && recordedApproval) {
    mismatches.push('approved_manifest_hash must be empty before approval')
  } else if (!beforeApproval && recordedApproval !== calculated.manifest_hash) {
    mismatches.push('approved_manifest_hash mismatch')
  }
  return { ...calculated, mismatches }
}

function main() {
  const args = process.argv.slice(2)
  const check = args[0] === '--check'
  const file = check ? args[1] : args[0]
  if (!file || args.length !== (check ? 2 : 1)) {
    console.error('Usage: node manifest-hash.mjs [--check] <batch-manifest.md>')
    process.exitCode = 2
    return
  }
  try {
    const content = fs.readFileSync(path.resolve(file), 'utf8')
    const cursor = parseCursor(content)
    const result = check ? checkManifest(content) : hashManifest(parseManifest(content), cursor.batch_id, parsePlan(content))
    console.log(JSON.stringify(result, null, 2))
    if (check && result.mismatches.length) process.exitCode = 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
