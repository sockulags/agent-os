# Batch manifest

The coordinator-owned manifest lives at `.agent-os/batches/<batch-slug>.md`. It is resumable working
state, not an approval ledger.

## Cursor

```yaml
---
agent_os_batch: 2
batch_id: <stable slug>
status: planned
next_action: dispatch-frontier
manifest_hash: ""
---
```

Statuses are `planned`, `running`, `reconciling`, `verifying`, `ready`, `delivered`, and `blocked`.
Keep `next_action` concrete except after delivery.

## Definitions

```json batch-plan
{
  "baseline_sha": "<integration baseline>",
  "integration_branch": "<project convention>",
  "max_workers": 2,
  "retry_limit": 1,
  "integration_strategy": "serial cherry-pick",
  "aggregate_checks": []
}
```

```json batch-task
{
  "task_key": "<stable within batch_id>",
  "source": "<spec or issue link>",
  "dependencies": [],
  "scope": [],
  "outcome": "",
  "non_goals": [],
  "checks": [],
  "task_hash": ""
}
```

Identity is `(batch_id, task_key)`. Run:

```text
node skills/batch-work/scripts/manifest-hash.mjs <manifest.md>
node skills/batch-work/scripts/manifest-hash.mjs --check <manifest.md>
```

The script validates fields, dependencies, cycles, runtime identity, and stable task and manifest
hashes. Hashes detect definition drift; they do not represent human approval.

## Runtime

```json batch-runtime
{
  "tasks": [
    {
      "task_key": "<definition task_key>",
      "state": "pending",
      "attempt": 0,
      "branch": "",
      "worktree": "",
      "worker_id": "",
      "head_sha": "",
      "result": ""
    }
  ]
}
```

Task states are `pending`, `ready`, `running`, `succeeded`, `integrated`, `failed`, `blocked`, and
`conflict`. Persist repository-relative or portable worktree keys, not absolute machine paths.

Before launch, create the isolated branch and worktree and record a new attempt. A returned worker
identity moves it to `running`. The worker result is concise: head SHA, changed files, checks, and
remaining uncertainty. The coordinator verifies the live task hash and attempt before integration.

## Frontier and reconciliation

The frontier contains pending tasks whose dependencies are integrated and whose scopes do not
overlap active work. Dispatch within host and project concurrency.

Only the coordinator edits the manifest and integration branch:

1. Re-read live branches, worktrees, and manifest.
2. Confirm the worker head belongs to the current task attempt.
3. Integrate once in dependency order.
4. Run the task checks on the integrated head.
5. Recompute the frontier.

After all tasks integrate, run the aggregate checks against the complete candidate.
Worker-local checks are useful context but are not proof of the integrated system.

The original request and project policy define whether delivery stops at local changes, a commit, a
pull request, merge, or deployment. Destructive cleanup requires the request or policy to include it.
