# Batch manifest and reconciliation contract

The manifest is the coordinator-owned source of truth. It lives at
`.agent-os/batches/<batch-slug>.md`; project policy decides whether operational state is tracked in
Git.

## Batch cursor

```yaml
---
agent_os_batch: 1
batch_id: <stable slug>
status: awaiting-approval
next_action: approve-manifest
manifest_hash: ""
approved_manifest_hash: ""
---
```

Allowed forward states are:

```text
awaiting-approval → approved → running → reconciling → verifying → ready-to-deliver → delivered
```

Use `blocked` only with `blocked_from`, non-empty `blocked_reason`, and non-empty `next_action`.
`blocked_from` names one allowed forward state. A block from `awaiting-approval` keeps
`approved_manifest_hash` empty; every later block retains the exact approved hash. Resume from the
manifest cursor after reconciling live state; conversation history is never the cursor.

## Task definition

The frozen dispatch and integration plan is one machine-readable block:

```json batch-plan
{
  "baseline_sha": "<integration baseline>",
  "integration_branch": "<policy-derived branch>",
  "max_mutating_workers": 2,
  "retry_limit": 1,
  "integration_strategy": "serial cherry-pick",
  "aggregate_verification": [],
  "pr_authority": "",
  "merge_authority": "",
  "cleanup_authority": ""
}
```

Each task is one machine-readable block:

```json batch-task
{
  "task_key": "<stable within batch_id>",
  "source": "<spec or issue link>",
  "dependencies": [],
  "owned_scope": [],
  "goal": "",
  "non_goals": [],
  "acceptance": [],
  "verification": [],
  "mutation_authority": "",
  "external_side_effect_authority": "",
  "delivery_boundary": "local commit + worker receipt",
  "task_hash": ""
}
```

Identity is `(batch_id, task_key)`. Run:

```text
node skills/batch-work/scripts/manifest-hash.mjs <batch-manifest.md>
```

The script validates strict YAML cursor frontmatter, keys, dependency references and cycles,
normalizes definition fields, and computes every task hash plus a `manifest_hash` bound to `batch_id`,
the complete batch plan, and task-key-sorted hashes. Copy those values into the draft, leave
`approved_manifest_hash` empty, initialize the runtime block below, then run
`manifest-hash.mjs --check <batch-manifest.md>` before presenting it. Approval copies the current
`manifest_hash` into the cursor and every runtime task's `approved_manifest_hash`. The hash excludes
runtime state, attempts, receipts, task-attempt branch names, and worktree keys. Any definition
change recomputes `manifest_hash`, clears all approved-manifest hashes, returns the batch to
`awaiting-approval`, and requires a new human checkpoint.

`external_side_effect_authority` governs the worker's task execution against services, data, and
people. Repository delivery is a separate coordinator boundary: PR creation follows project/session
delivery policy, and merge still requires explicit authority.

## Task runtime

Task states are:

```text
pending → ready → running → succeeded → integrated
```

`failed`, `blocked`, and `conflict` are explicit side states. A runtime record contains the current
state, active attempt, policy-derived branch and worktree key, baseline SHA, worker identity,
dispatch time, and receipts. Persist a portable worktree key, never an absolute machine path.

Persist exactly one machine-readable runtime block with exactly one entry per task:

```json batch-runtime
{
  "tasks": [
    {
      "task_key": "<definition task_key>",
      "task_hash": "<current task hash>",
      "approved_manifest_hash": "",
      "state": "pending",
      "state_reason": "",
      "active_attempt": 0,
      "branch_key": "",
      "worktree_key": "",
      "baseline_sha": "<batch-plan baseline_sha>",
      "worker_id": "",
      "dispatch_time": "",
      "receipts": [],
      "rejected_receipts": []
    }
  ]
}
```

The hash checker rejects missing, duplicate, or unknown runtime task identities; stale task,
approved-manifest, or baseline hashes; invalid states and attempts; and incomplete active workspace
identity. Runtime changes do not change `manifest_hash`, but they must pass `--check`.

An attempt identity is `(batch_id, task_key, attempt_number)`. A retry increments the attempt under
the same task key. It never creates another task. Stop when the project retry limit is reached.

For dispatch, the coordinator creates the isolated branch and worktree, persists their portable key,
active attempt and task state `ready`, then requests a worker. Only a returned worker identity moves
the task to `running`. A launch error moves that attempt to `failed`; a prompt artifact or queued
intention never counts as a running worker.

## Approval and deliver-work

The manifest draft is the only batch write allowed before approval. Approval must name the presented
batch and record its aggregate hash.

A batch launch may satisfy `deliver-work`'s tracked checkpoint only when all of these match live
state:

- batch ID and task key;
- frozen task hash and aggregate approved hash;
- active attempt;
- task state `ready` or `running`;
- baseline and authorized scope;
- `delivery_boundary: local commit + worker receipt`.

Otherwise `deliver-work` halts before product mutation. A matching worker uses a stable work record
such as `.agent-os/work/<batch-id>--<task-key>.md`, records both task and approved manifest hashes,
commits only to its task branch, and returns a receipt instead of pushing, opening a PR, or merging.

## Frontier and capacity

The ready frontier contains pending tasks whose dependencies are `integrated`. Before dispatch,
compare owned paths and public seams against every running task. An overlap becomes `conflict` unless
the manifest already serializes the tasks with a dependency edge.

Dispatch at most the lower of host capacity and project policy. Reserve enough capacity for the
coordinator and the independent reviewers required by `deliver-work`; saturating all contexts makes
the promised review impossible.

## Worker receipt

```text
batch_id:
task_key:
task_hash:
approved_manifest_hash:
attempt:
worker:
baseline_sha:
head_sha:
changed_files:
acceptance_evidence:
commands_and_results:
review_result:
external_side_effects:
remaining_uncertainty:
```

Each accepted receipt is stored as an object in the owning task's `receipts` array with exactly the
fields above; the list-valued evidence fields are JSON string arrays. A rejected receipt is retained
under `rejected_receipts` as `{ "receipt": {...}, "rejection_reasons": [...] }`. The checker emits
and requires exact batch, task, hash, active-attempt, worker and baseline mismatch reasons; the
coordinator prefixes evidence-backed scope or authority diagnostics with `semantic: `. Rejection of
the current attempt moves it to `failed` with matching `state_reason`. A historical stale receipt is
retained without interrupting a newer active attempt. Neither form changes integration.

## Reconciliation and integration

Only the coordinator writes the manifest or integration branch.

1. Re-read the manifest, task branches, worktrees, integration head, and receipts.
2. Mark an attempt `succeeded` only after its receipt passes every identity and scope check.
3. Integrate one succeeded task at a time in dependency order using project policy. When its head is
   already contained, record it as `integrated` without applying it again.
4. Run the task verification on the integrated head. A failure becomes `blocked` with evidence.
5. Recompute the frontier and dispatch another bounded wave.

After every task is integrated, set `reconciling`, verify no task or receipt is missing, then set
`verifying` and run the manifest's fresh aggregate commands. Individual worker evidence is stale for
the integrated candidate. Pass moves to `ready-to-deliver`; failure remains blocked at `verifying`.

Batch approval never enlarges delivery authority. Create or update one batch PR only when the frozen
`pr_authority` and current session or project policy both permit it; otherwise stop at the local
`ready-to-deliver` candidate. Merge only when the frozen `merge_authority` and current authority both
permit it; otherwise stop at the batch PR. Set `delivered` after the authorized boundary is
evidenced. Clean worktrees or branches only when the frozen `cleanup_authority` and current policy
both permit cleanup; otherwise report them.
