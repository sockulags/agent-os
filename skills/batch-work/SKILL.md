---
name: batch-work
description: Plans and runs several decision-ready units through isolated workers and aggregate verification. User-invoked for an explicit batch. Not for unresolved decisions, one unit, or a loose backlog.
disable-model-invocation: true
---

# Batch work

Read project policy and [references/manifest.md](references/manifest.md). The request defines whether
to plan the batch, execute it, or both.

Batch-work consumes an existing set of implementation-ready, dependency-mapped issues. It does not
discover, decompose, or represent a product shape, and the existence of several issues does not
invoke it. Use this workflow only when the developer explicitly requests an integrated batch.

## Contract

- **Outcome:** one integrated candidate whose full behavior passes the aggregate ground truth.
- **Working surface:** the manifest, coordinator branch, isolated task worktrees, and task branches.
- **Boundaries:** workers own only their task workspace; the coordinator owns the manifest and
  integration. Merge, deploy, destructive cleanup, and external effects follow the request or
  project policy.
- **Ground truth:** task checks on each result plus fresh aggregate checks after integration.

## Loop

1. Confirm every source issue has a stable identity, outcome, scope, dependencies, and checks. Route
   unresolved product decisions or missing decomposition to `shape-work` or `chart-work`.
2. Create or update `.agent-os/batches/<batch-slug>.md`. Validate its graph and definition hashes.
   A planning-only request stops here; an execution request continues.
3. Reconcile the manifest with live Git and worktree state before every dispatch wave.
4. Dispatch the open frontier into isolated workspaces within project concurrency. Each worker gets
   one current task definition and returns a commit SHA, changed files, checks, and uncertainty.
5. Integrate completed tasks in dependency order. Detect already-contained commits, rerun relevant
   checks on the integrated head, and stop on conflicts rather than guessing.
6. After all tasks integrate, run fresh aggregate checks.
7. Treat the integrated batch as material. Apply the
   [deliver-work review gate](../deliver-work/workflow.md#review-gate) to the complete candidate,
   resolve supported findings, and rerun affected aggregate checks.
8. Deliver the candidate only to the boundary named by the request or project policy.

Definition drift while work is active invalidates the affected task result and requires an explicit
replan or fresh attempt. Individual worker checks never substitute for aggregate verification.
