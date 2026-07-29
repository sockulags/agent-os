# batch-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:batch-work` or `$batch-work`

Plans and runs several decision-ready units through isolated workers and aggregate verification.

The request decides whether the workflow plans, executes, or does both. A planning-only request
creates the manifest and stops. An execution request continues without a second approval checkpoint.

Each task has a stable key, outcome, scope, dependencies, checks, and definition hash. Independent
frontier tasks run in isolated branches and worktrees. Workers return concise results; the
coordinator owns the manifest and integration branch.

After each integration the coordinator reruns relevant checks. After all tasks integrate, fresh
aggregate checks decide whether the complete candidate is ready. Worker-local success is never a
substitute for integrated behavior.

Definition drift invalidates an affected result. Merge, deploy, destructive cleanup, and external
effects follow the request or project policy.

See [Batch manifests](/reference/batches).
