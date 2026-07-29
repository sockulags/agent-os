#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { checkManifest, hashManifest, hashTask, parseCursor, parseManifest, parsePlan } from './manifest-hash.mjs'

function task(key, dependencies = []) {
  return {
    task_key: key,
    source: 'spec.md',
    dependencies,
    owned_scope: [`src/${key}/`],
    goal: `Implement ${key}`,
    non_goals: ['No unrelated cleanup'],
    acceptance: [`${key} works`],
    verification: [`test ${key}`],
    mutation_authority: 'owned_scope only',
    external_side_effect_authority: 'none',
    delivery_boundary: 'local commit + worker receipt',
    task_hash: ''
  }
}

function plan() {
  return {
    baseline_sha: 'abc123',
    integration_branch: 'batch/demo',
    max_mutating_workers: 2,
    retry_limit: 1,
    integration_strategy: 'serial cherry-pick',
    aggregate_verification: ['npm test'],
    pr_authority: 'permitted',
    merge_authority: 'explicit only',
    cleanup_authority: 'explicit only'
  }
}

function manifest(tasks, manifestHash = '', approvedHash = '', status = 'awaiting-approval', batchId = 'demo-batch', batchPlan = plan(), cursorExtras = '') {
  const planBlock = `\`\`\`json batch-plan\n${JSON.stringify(batchPlan, null, 2)}\n\`\`\``
  const blocks = tasks.map((value) => `\`\`\`json batch-task\n${JSON.stringify(value, null, 2)}\n\`\`\``).join('\n\n')
  const runtime = {
    tasks: tasks.map((value) => ({
      task_key: value.task_key,
      task_hash: value.task_hash,
      approved_manifest_hash: approvedHash,
      state: 'pending',
      state_reason: '',
      active_attempt: 0,
      branch_key: '',
      worktree_key: '',
      baseline_sha: batchPlan.baseline_sha,
      worker_id: '',
      dispatch_time: '',
      receipts: [],
      rejected_receipts: []
    }))
  }
  const runtimeBlock = `\`\`\`json batch-runtime\n${JSON.stringify(runtime, null, 2)}\n\`\`\``
  return `---\nagent_os_batch: 1\nbatch_id: ${batchId}\nstatus: ${status}\nnext_action: continue\nmanifest_hash: "${manifestHash}"\napproved_manifest_hash: "${approvedHash}"${cursorExtras ? `\n${cursorExtras}` : ''}\n---\n\n${planBlock}\n\n${blocks}\n\n${runtimeBlock}\n`
}

function rewriteRuntime(content, update) {
  return content.replace(/```json batch-runtime\n([\s\S]*?)\n```/, (_match, json) => {
    const runtime = JSON.parse(json)
    update(runtime)
    return `\`\`\`json batch-runtime\n${JSON.stringify(runtime, null, 2)}\n\`\`\``
  })
}

function receipt(taskValue, approvedHash, overrides = {}) {
  return {
    batch_id: 'demo-batch',
    task_key: taskValue.task_key,
    task_hash: taskValue.task_hash,
    approved_manifest_hash: approvedHash,
    attempt: 1,
    worker: 'worker-1',
    baseline_sha: 'abc123',
    head_sha: 'deadbeef',
    changed_files: [`src/${taskValue.task_key}/index.js`],
    acceptance_evidence: [`${taskValue.task_key} works`],
    commands_and_results: [`test ${taskValue.task_key}: pass`],
    review_result: 'pass',
    external_side_effects: [],
    remaining_uncertainty: [],
    ...overrides
  }
}

const alpha = task('alpha')
const beta = task('beta', ['alpha'])
const first = hashManifest([alpha, beta], 'demo-batch', plan())
const reversed = hashManifest([beta, alpha], 'demo-batch', plan())
assert.deepEqual(first, reversed, 'aggregate hash must ignore manifest block order')
const reorderedPlan = Object.fromEntries(Object.entries(plan()).reverse())
assert.equal(
  first.manifest_hash,
  hashManifest([alpha, beta], 'demo-batch', reorderedPlan).manifest_hash,
  'aggregate hash must ignore batch-plan property order'
)
assert.notEqual(first.manifest_hash, hashManifest([alpha, beta], 'other-batch', plan()).manifest_hash)
assert.notEqual(first.manifest_hash, hashManifest([alpha, beta], 'demo-batch', { ...plan(), retry_limit: 2 }).manifest_hash)

const crlf = { ...alpha, goal: 'line one\r\nline two' }
const lf = { ...alpha, goal: 'line one\nline two' }
assert.equal(hashTask(crlf), hashTask(lf), 'line endings must normalize to LF')

const changed = { ...alpha, acceptance: ['different acceptance'] }
assert.notEqual(hashTask(alpha), hashTask(changed), 'definition drift must change task hash')

const approvedTasks = [alpha, beta].map((value) => ({
  ...value,
  task_hash: first.task_hashes.find((entry) => entry.task_key === value.task_key).task_hash
}))
assert.deepEqual(checkManifest(manifest(approvedTasks, first.manifest_hash)).mismatches, [])
assert.deepEqual(checkManifest(manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'approved')).mismatches, [])
assert.match(
  checkManifest(manifest(approvedTasks, first.manifest_hash, first.manifest_hash)).mismatches.join('\n'),
  /must be empty before approval/
)

const staleTasks = approvedTasks.map((value) => value.task_key === 'alpha'
  ? { ...value, acceptance: ['drift after approval'] }
  : value)
assert.throws(
  () => checkManifest(manifest(staleTasks, first.manifest_hash, first.manifest_hash, 'approved')),
  /runtime: task_hash mismatch/
)

assert.throws(() => parseManifest(manifest([alpha, alpha])), /duplicate task_key/)
assert.throws(() => parseManifest(manifest([task('orphan', ['missing'])])), /unknown dependency/)
assert.throws(() => parseManifest(manifest([task('a', ['b']), task('b', ['a'])])), /dependency cycle/)
assert.throws(() => hashTask({ ...alpha, hidden_scope: 'src/other/**' }), /unknown fields/)
assert.throws(() => parsePlan(manifest([alpha], '', '', 'awaiting-approval', 'demo-batch', { ...plan(), hidden: true })), /unknown fields/)
assert.throws(() => checkManifest(manifest([alpha], first.manifest_hash, '', 'draft')), /unsupported batch status/)
for (const field of ['owned_scope', 'acceptance', 'verification']) {
  assert.throws(() => hashTask({ ...alpha, [field]: [''] }), /non-empty strings/)
}
assert.throws(
  () => hashManifest([alpha], 'demo-batch', { ...plan(), aggregate_verification: [''] }),
  /non-empty strings/
)
assert.throws(() => parseCursor(manifest([alpha]).replace(/^---\n/, '')), /must start with YAML frontmatter/)
assert.throws(
  () => parseCursor(manifest([alpha]).replace('status: awaiting-approval', 'status: awaiting-approval\nstatus: approved')),
  /duplicate frontmatter field/
)
assert.throws(() => parseCursor(manifest([alpha]).replace('agent_os_batch: 1\n', '')), /missing frontmatter field/)
const blockedBeforeApproval = manifest(
  approvedTasks,
  first.manifest_hash,
  '',
  'blocked',
  'demo-batch',
  plan(),
  'blocked_from: awaiting-approval\nblocked_reason: waiting for corrected scope'
)
assert.deepEqual(checkManifest(blockedBeforeApproval).mismatches, [])
assert.throws(
  () => checkManifest(manifest(approvedTasks, first.manifest_hash, '', 'blocked')),
  /requires a valid blocked_from/
)
assert.throws(
  () => checkManifest(manifest(approvedTasks, first.manifest_hash).replace(/```json batch-runtime[\s\S]*?\n```\n/, '')),
  /exactly one json batch-runtime/
)

const changedPlan = { ...plan(), pr_authority: 'different authority' }
const changedPlanHash = hashManifest(approvedTasks, 'demo-batch', changedPlan).manifest_hash
const staleApprovalReceipt = rewriteRuntime(
  manifest(approvedTasks, changedPlanHash, changedPlanHash, 'approved', 'demo-batch', changedPlan),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'succeeded',
      active_attempt: 1,
      branch_key: 'batch/demo/alpha',
      worktree_key: 'alpha-attempt-1',
      worker_id: 'worker-1',
      dispatch_time: '2026-07-29T12:00:00Z',
      receipts: [receipt(approvedTasks[0], first.manifest_hash)]
    }
  }
)
assert.throws(() => checkManifest(staleApprovalReceipt), /receipt: approved_manifest_hash mismatch/)
const retainedRejectedReceipt = rewriteRuntime(
  manifest(approvedTasks, changedPlanHash, changedPlanHash, 'approved', 'demo-batch', changedPlan),
  (runtime) => {
    const rejectedReceipt = receipt(approvedTasks[0], first.manifest_hash)
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'failed',
      state_reason: 'rejected receipt: approved_manifest_hash mismatch',
      active_attempt: 1,
      branch_key: 'batch/demo/alpha',
      worktree_key: 'alpha-attempt-1',
      worker_id: 'worker-1',
      dispatch_time: '2026-07-29T12:00:00Z',
      rejected_receipts: [{
        receipt: rejectedReceipt,
        rejection_reasons: ['approved_manifest_hash mismatch']
      }]
    }
  }
)
assert.deepEqual(checkManifest(retainedRejectedReceipt).mismatches, [])

const staleAttemptReceipt = rewriteRuntime(
  manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'running'),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'running',
      active_attempt: 2,
      branch_key: 'batch/demo/alpha-2',
      worktree_key: 'alpha-attempt-2',
      worker_id: 'current-worker',
      dispatch_time: '2026-07-29T13:00:00Z',
      receipts: [receipt(approvedTasks[0], first.manifest_hash, { worker: 'old-worker' })]
    }
  }
)
assert.throws(() => checkManifest(staleAttemptReceipt), /attempt mismatch, worker mismatch/)

const wrongWorkerReceipt = rewriteRuntime(
  manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'running'),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'running',
      active_attempt: 1,
      branch_key: 'batch/demo/alpha-1',
      worktree_key: 'alpha-attempt-1',
      worker_id: 'current-worker',
      dispatch_time: '2026-07-29T13:00:00Z',
      receipts: [receipt(approvedTasks[0], first.manifest_hash, { worker: 'different-worker' })]
    }
  }
)
assert.throws(() => checkManifest(wrongWorkerReceipt), /worker mismatch/)

const fabricatedRejection = rewriteRuntime(
  manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'running'),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'running',
      active_attempt: 1,
      branch_key: 'batch/demo/alpha-1',
      worktree_key: 'alpha-attempt-1',
      worker_id: 'worker-1',
      dispatch_time: '2026-07-29T13:00:00Z',
      rejected_receipts: [{
        receipt: receipt(approvedTasks[0], first.manifest_hash),
        rejection_reasons: ['fabricated reason']
      }]
    }
  }
)
assert.throws(() => checkManifest(fabricatedRejection), /unsupported reasons/)

const historicalRetained = rewriteRuntime(
  manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'running'),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'running',
      active_attempt: 2,
      branch_key: 'batch/demo/alpha-2',
      worktree_key: 'alpha-attempt-2',
      worker_id: 'current-worker',
      dispatch_time: '2026-07-29T13:00:00Z',
      rejected_receipts: [{
        receipt: receipt(approvedTasks[0], first.manifest_hash, { worker: 'old-worker' }),
        rejection_reasons: ['attempt mismatch', 'worker mismatch']
      }]
    }
  }
)
assert.deepEqual(checkManifest(historicalRetained).mismatches, [])

const semanticCurrentRejection = rewriteRuntime(
  manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'running'),
  (runtime) => {
    runtime.tasks[0] = {
      ...runtime.tasks[0],
      state: 'failed',
      state_reason: 'semantic: changed_files outside owned_scope',
      active_attempt: 1,
      branch_key: 'batch/demo/alpha-1',
      worktree_key: 'alpha-attempt-1',
      worker_id: 'worker-1',
      dispatch_time: '2026-07-29T13:00:00Z',
      rejected_receipts: [{
        receipt: receipt(approvedTasks[0], first.manifest_hash),
        rejection_reasons: ['semantic: changed_files outside owned_scope']
      }]
    }
  }
)
assert.deepEqual(checkManifest(semanticCurrentRejection).mismatches, [])

assert.throws(
  () => checkManifest(
    manifest(approvedTasks, first.manifest_hash, first.manifest_hash, 'approved')
      .replace('next_action: continue', 'next_action:')
  ),
  /active manifest requires next_action/
)

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-batch-hash-'))
try {
  const validPath = path.join(temporaryRoot, 'valid.md')
  const mismatchPath = path.join(temporaryRoot, 'mismatch.md')
  const malformedPath = path.join(temporaryRoot, 'malformed.md')
  fs.writeFileSync(validPath, manifest(approvedTasks, first.manifest_hash), 'utf8')
  fs.writeFileSync(mismatchPath, manifest(approvedTasks, '0'.repeat(64)), 'utf8')
  fs.writeFileSync(malformedPath, manifest(approvedTasks, first.manifest_hash).replace(/^---\n/, ''), 'utf8')
  const script = fileURLToPath(new URL('./manifest-hash.mjs', import.meta.url))
  assert.equal(spawnSync(process.execPath, [script, '--check', validPath]).status, 0)
  assert.equal(spawnSync(process.execPath, [script, '--check', mismatchPath]).status, 1)
  assert.equal(spawnSync(process.execPath, [script, '--check', malformedPath]).status, 2)
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}

console.log('batch manifest hash tests passed.')
