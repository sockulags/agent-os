# Batch manifests

`batch-work` keeps resumable coordinator state in `.agent-os/batches/<batch-slug>.md`.

The cursor records batch ID, current status, next action, and a definition hash. The plan records the
integration baseline, branch, concurrency, retries, integration strategy, and aggregate checks. Each
task records a stable key, source, dependencies, scope, outcome, non-goals, checks, and task hash.

Runtime state stays compact: state, attempt, branch, portable worktree key, worker ID, head SHA, and
a concise result summary.

Hashes detect task-definition drift. They do not represent approval or mutation authority. The
developer's request decides whether the workflow plans, executes, creates a PR, merges, deploys, or
cleans up.

The coordinator reconciles live Git state before dispatch and integration. Workers operate in
isolated task workspaces. After serial integration, the coordinator reruns task checks and then the
fresh aggregate ground truth. See the source
[manifest contract](https://github.com/sockulags/agent-os/blob/main/skills/batch-work/references/manifest.md).
