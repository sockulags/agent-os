# Batch manifests

`batch-work` keeps coordinator state in `.agent-os/batches/<batch-slug>.md`. The project policy
decides whether that operational state is tracked in Git.

## Batch state

The frontmatter carries `agent_os_batch: 1`, stable `batch_id`, `status`, `next_action`, current
`manifest_hash` and `approved_manifest_hash`.

```text
awaiting-approval → approved → running → reconciling → verifying → ready-to-deliver → delivered
```

`blocked` requires `blocked_from`, non-empty `blocked_reason` and non-empty `next_action`. A block
from `awaiting-approval` keeps the approval hash empty; later blocks retain it. Resume starts by
reconciling the manifest with live branches, worktrees and receipts; conversation history is never
the cursor.

## Frozen task definitions

Identity is `(batch_id, task_key)`. Each task defines its source, dependencies, owned paths or public
seams, goal, non-goals, acceptance, verification, mutation and external-side-effect authority, and
`local commit + worker receipt` delivery boundary.

One `json batch-plan` block records the baseline, integration branch, concurrency, retry limit,
integration strategy, aggregate verification and PR/merge/cleanup authority. Each task definition is
a `json batch-task` block. Run
`node skills/batch-work/scripts/manifest-hash.mjs <batch-manifest.md>` to validate strict cursor
frontmatter, keys, dependency references and cycles and compute task hashes plus a manifest hash
bound to the batch ID, complete plan and task-key-sorted hashes. Copy the values into the draft, then
run the same command with `--check` before presenting it. The draft records `manifest_hash` while
`approved_manifest_hash` stays empty; approval copies the current value into the cursor and every
runtime task.

The script normalizes definition fields and LF line endings before SHA-256. Runtime state, attempts,
receipts, task-attempt branches and worktree keys stay outside the hash. Approval records that canonical
manifest hash. Any definition change clears approval and returns the batch to its
checkpoint.

External-side-effect authority governs task execution against services, data and people. Repository
delivery is separate: the coordinator follows PR policy, and merge still requires explicit
authority.

## Task runtime and attempts

```text
pending → ready → running → succeeded → integrated
```

`failed`, `blocked` and `conflict` are explicit side states. An attempt is
`(batch_id, task_key, attempt_number)`; retries increment the attempt without creating another task.
Persist a portable worktree key, never an absolute machine path.

Exactly one `json batch-runtime` block contains a `tasks` array with one entry per definition. Each
entry has `task_key`, `task_hash`, `approved_manifest_hash`, `state`, `state_reason`,
`active_attempt`, portable `branch_key` and `worktree_key`, `baseline_sha`, `worker_id`,
`dispatch_time`, accepted `receipts` and `rejected_receipts`. Runtime updates stay outside the
manifest hash, while `--check` rejects missing or duplicate tasks and stale task, approval or
baseline hashes.

Before dispatch, the coordinator creates isolation and persists the workspace key, attempt and
`ready` state. A returned native worker identity moves it to `running`; a launch error becomes
`failed`. Prompt artifacts never count as workers.

A hash-bound batch launch can satisfy `deliver-work`'s checkpoint only when the live identity, task
and aggregate hashes, attempt, baseline, scope, states and delivery boundary all match. The worker
then commits to its isolated task branch and returns a receipt instead of pushing, opening a PR or
merging.

## Frontier and receipts

The ready frontier contains pending tasks whose dependencies are integrated. A task whose owned path
or public seam overlaps running work becomes a conflict unless a dependency edge already serializes
it. Concurrency is the lower of host capacity and project policy, with capacity reserved for the
coordinator and required reviewers.

A receipt object records batch and task identity, task and approved manifest hashes, attempt, worker,
baseline and head SHA, changed files, acceptance evidence, commands and results, review result,
external side effects and remaining uncertainty. It lives in the owning runtime task's `receipts`
array. Rejected receipts remain in `rejected_receipts` with exact machine-field and semantic
rejection reasons. Accepted receipts must match the active attempt and worker. A rejected current
attempt becomes `failed` with the same reason; a historical stale receipt is retained without
interrupting a newer attempt. The coordinator discards neither form of evidence.

## Reconciliation and delivery

Only the coordinator writes the manifest and integration branch. It accepts matching receipts,
integrates successful commits one at a time in dependency order, recognizes already-contained commits
instead of applying them twice, and reruns each task's checks on the integrated head.

After all tasks are integrated, fresh aggregate verification runs against the complete candidate.
Worker evidence alone is stale for that combined state. A pass moves to `ready-to-deliver`; a failure
blocks at `verifying`.

Batch approval does not enlarge PR, merge or cleanup authority. The coordinator creates or updates
one batch PR only when frozen and current PR authority both permit it; otherwise it stops at the
local `ready-to-deliver` candidate. It merges or cleans branches and worktrees only when the
corresponding frozen and current authority both permit it.
