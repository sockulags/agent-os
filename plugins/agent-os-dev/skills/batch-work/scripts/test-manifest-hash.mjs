#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { checkManifest, hashManifest, hashTask, parseCursor, parseManifest } from './manifest-hash.mjs'

function task(key, dependencies = []) {
  return {
    task_key: key,
    source: 'spec.md',
    dependencies,
    scope: [`src/${key}/`],
    outcome: `Implement ${key}`,
    non_goals: ['Unrelated cleanup'],
    checks: [`test ${key}`],
    task_hash: ''
  }
}

function plan() {
  return {
    baseline_sha: 'abc123',
    integration_branch: 'batch/demo',
    max_workers: 2,
    retry_limit: 1,
    integration_strategy: 'serial cherry-pick',
    aggregate_checks: ['npm test']
  }
}

function manifest(tasks, status = 'planned', cursorExtras = {}) {
  const batchPlan = plan()
  const taskHashes = Object.fromEntries(tasks.map((value) => [value.task_key, hashTask(value)]))
  const complete = tasks.map((value) => ({ ...value, task_hash: taskHashes[value.task_key] }))
  const manifestHash = hashManifest('demo-batch', batchPlan, complete)
  const runtime = {
    tasks: complete.map((value) => ({
      task_key: value.task_key,
      state: 'pending',
      attempt: 0,
      branch: '',
      worktree: '',
      worker_id: '',
      head_sha: '',
      result: ''
    }))
  }
  const cursor = {
    agent_os_batch: '2',
    batch_id: 'demo-batch',
    status,
    next_action: status === 'delivered' ? '' : 'dispatch-frontier',
    manifest_hash: manifestHash,
    ...cursorExtras
  }
  const frontmatter = Object.entries(cursor).map(([key, value]) => `${key}: "${value}"`).join('\n')
  const taskBlocks = complete.map((value) => `\`\`\`json batch-task\n${JSON.stringify(value, null, 2)}\n\`\`\``).join('\n\n')
  return `---\n${frontmatter}\n---\n\n\`\`\`json batch-plan\n${JSON.stringify(batchPlan, null, 2)}\n\`\`\`\n\n${taskBlocks}\n\n\`\`\`json batch-runtime\n${JSON.stringify(runtime, null, 2)}\n\`\`\`\n`
}

function rewriteRuntime(content, update) {
  return content.replace(/```json batch-runtime\n([\s\S]*?)\n```/, (_match, json) => {
    const runtime = JSON.parse(json)
    update(runtime)
    return `\`\`\`json batch-runtime\n${JSON.stringify(runtime, null, 2)}\n\`\`\``
  })
}

const alpha = task('alpha')
const beta = task('beta', ['alpha'])
const valid = manifest([alpha, beta])
assert.deepEqual(checkManifest(valid).mismatches, [])
assert.equal(parseManifest(valid).tasks.length, 2)
assert.equal(parseCursor(valid).status, 'planned')

assert.equal(hashTask(alpha), hashTask({ ...alpha, task_hash: 'ignored' }))
assert.notEqual(hashTask(alpha), hashTask({ ...alpha, outcome: 'Changed outcome' }))
assert.equal(
  hashManifest('demo-batch', plan(), [alpha, beta]),
  hashManifest('demo-batch', plan(), [beta, alpha]),
  'task order must not affect aggregate hash'
)

assert.throws(() => parseCursor(valid.replace('status: "planned"', 'status: "planned"\nstatus: "running"')), /duplicate cursor/)
assert.throws(() => parseManifest(valid.replace('"dependencies": []', '"dependencies": ["missing"]')), /unknown dependency/)
assert.throws(() => parseManifest(manifest([task('alpha', ['beta']), task('beta', ['alpha'])])), /dependency cycle/)

const activeWithoutWorkspace = rewriteRuntime(valid, (runtime) => {
  runtime.tasks[0].state = 'running'
  runtime.tasks[0].attempt = 1
})
assert.throws(() => parseManifest(activeWithoutWorkspace), /requires attempt, branch, and worktree/)

const absoluteWorktree = rewriteRuntime(valid, (runtime) => {
  Object.assign(runtime.tasks[0], {
    state: 'ready',
    attempt: 1,
    branch: 'task/alpha',
    worktree: 'C:\\temp\\alpha'
  })
})
assert.throws(() => parseManifest(absoluteWorktree), /worktree must be portable/)

const blockedDependency = rewriteRuntime(valid, (runtime) => {
  Object.assign(runtime.tasks[1], {
    state: 'ready',
    attempt: 1,
    branch: 'task/beta',
    worktree: 'worktrees/beta'
  })
})
assert.throws(() => parseManifest(blockedDependency), /dependency alpha is not integrated/)

const staleHash = valid.replace(/task_hash": "[a-f0-9]+"/, 'task_hash": "stale"')
assert(checkManifest(staleHash).mismatches.includes('alpha: task_hash mismatch'))

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-batch-'))
try {
  const file = path.join(temporary, 'manifest.md')
  fs.writeFileSync(file, valid)
  const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'manifest-hash.mjs')
  const result = spawnSync(process.execPath, [script, '--check', file], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

console.log('batch manifest tests passed.')
