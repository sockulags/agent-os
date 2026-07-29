---
name: batch-work
description: Plans and runs several approved, decision-complete units through isolated deliver-work workers. User-invoked before creating worktrees or workers. Not for unresolved decisions, one unit, or a loose backlog.
disable-model-invocation: true
---

# Batch work

Read project policy and [references/manifest.md](references/manifest.md) completely before creating
or changing a manifest. The coordinator owns it; workers own only isolated task branches.

## Mode A — plan and approve

1. **Validate readiness.** Trace every input to decision-complete intent. Route one unit to
   `deliver-work`, each bounded open decision to `shape-work`, and coupled decisions to `chart-work`;
   HALT without a batch.
2. **Decompose stable units.** Record each task's key, dependencies, scope, goal, non-goals,
   acceptance, verification, authorities, and delivery boundary.
3. **Draft the manifest.** Write only `.agent-os/batches/<batch-slug>.md`, run the reference's hash
   script, initialize its canonical runtime block, then compute the dependency frontier,
   policy-limited concurrency, integration order, and aggregate checks.
4. **Present one checkpoint.** Show the complete manifest and dispatch plan. HALT before branches,
   worktrees, tracker writes, workers, or product mutation. Approval freezes the complete manifest
   hash: plan plus task definitions.

## Mode B — run or resume

1. **Reconcile first.** Re-read the approved manifest and live Git/worktree state. Definition drift
   invalidates approval and returns to Mode A; runtime receipt updates do not.
2. **Compute the frontier.** Select tasks whose dependencies are integrated and whose authorized
   scopes do not overlap active work. Reserve capacity for the coordinator and independent reviewers.
3. **Dispatch isolated attempts.** Create one policy-named branch, worktree, and context per mutating
   worker. Persist the ready attempt and workspace before launch; set `running` only after the host
   returns a worker identity. Explicitly invoke `deliver-work` with batch ID, task key, frozen task
   and approved manifest hashes, attempt, and its commit-plus-receipt boundary. With no native worker
   mechanism, write exact hash-bound handoffs and HALT; prompts are not dispatched workers.
4. **Accept receipts defensively.** Only the coordinator updates the manifest. Reject stale identity,
   attempt, baseline, hash, scope, or authority. Policy-bounded retries preserve the task key.
5. **Integrate serially.** Apply successful commits in dependency order, detect already-contained
   commits, rerun task checks, and block conflicts rather than guessing.
6. **Verify the whole.** Run fresh aggregate checks on the integrated candidate. Only then mark
   `ready-to-deliver`. Create or update one batch PR only when the frozen `pr_authority` and current
   session or project policy permit it; otherwise stop with the local integrated candidate. Merge
   only when the frozen `merge_authority` and current authority both permit it; otherwise stop at
   the batch PR.

## Hard rules

- Batch approval authorizes only the frozen plan and task definitions; changed intent or execution
  policy requires a new checkpoint.
- Workers never edit the manifest, integration branch, another worktree, or another task's scope.
- Individual green receipts never substitute for aggregate verification.
- Cleanup requires matching frozen and current authority because it is destructive.
