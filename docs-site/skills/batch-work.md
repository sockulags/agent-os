# batch-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:batch-work` or `$batch-work`

Plans, dispatches and reconciles several approved, decision-complete units through isolated
[`deliver-work`](/skills/deliver-work) workers. Use it when a group has stable acceptance,
dependencies and scopes. Skip it for one unit, unresolved product decisions, or a loose backlog.

## Plan and approve

1. Validate every input. One ready unit routes to `deliver-work`; each bounded open decision routes
   to [`shape-work`](/skills/shape-work); coupled decisions route to
   [`chart-work`](/skills/chart-work).
2. Give each task a stable key, dependencies, owned paths or seams, goal, non-goals, acceptance,
   verification, mutation and side-effect authority, and a delivery boundary.
3. Draft only `.agent-os/batches/<batch-slug>.md`. Run the deterministic manifest hash script, then
   compute the dependency frontier, policy-limited concurrency, integration order and aggregate checks.
4. Show the complete manifest and dispatch plan. Halt before branches, worktrees, tracker writes,
   workers or product mutation. Explicit approval freezes the complete manifest hash: batch plan
   plus every task definition.

## Run or resume

Reconcile the manifest with live Git and worktree state first. Definition drift invalidates approval;
runtime receipt updates do not. Compute the ready frontier from tasks whose dependencies are
integrated and whose scopes do not overlap active work, while reserving capacity for the coordinator
and independent reviewers.

Each mutating worker receives one policy-named branch, worktree and context plus an explicit
`deliver-work` launch containing batch ID, task key, frozen task and approved manifest hashes,
attempt and a local commit-plus-receipt boundary. The coordinator persists a ready attempt and
workspace first, then marks it running only after the host returns a worker identity. If the host
cannot start native workers, it writes exact hash-bound handoffs and halts instead of claiming they
were dispatched.

Only the coordinator accepts receipts and edits the manifest. Stale identities, attempts, baselines,
hashes, scopes or authority are rejected. Retries preserve the task key and increment the attempt.
Successful commits integrate serially in dependency order, with task checks rerun on the integrated
head.

Fresh aggregate verification on the complete candidate is mandatory. Only then does the batch become
`ready-to-deliver`. A batch PR requires matching frozen PR authority and current session or
project-policy authority; without it, the workflow stops at the local integrated candidate. Merge
requires the same two-key check for merge authority; without it, the workflow stops at the batch PR.

See [Batch manifests](/reference/batches) for the full state, hash, frontier, receipt and
reconciliation contract.

## Hard rules

Batch approval covers only the frozen plan and task definitions. Workers never edit the manifest, integration
branch, another worktree or another task's scope. Individual green receipts never replace aggregate
verification. Worktree and branch cleanup requires matching frozen and current authority because it
is destructive.
