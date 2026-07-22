# Sequential workflow contract

Only the current step is executable. Read it completely, finish its checkable criterion, update state, and then load the one file named by `NEXT`. `HALT` ends the turn without loading another step.

Tracked work uses `.agent-os/work/<slug>.md`. Its frontmatter is the durable cursor:

```yaml
---
agent_os_work: 1
title: <work title>
mode: tracked
status: awaiting-approval
next_step: steps/03-checkpoint.md
baseline_sha: ""
review_target: ""
review_loop_iteration: 0
---
```

Allowed forward states are `awaiting-approval → approved → implementing → in-review → reviewed → verified → delivered`. Use `blocked` only with `blocked_from`, `next_step`, and a concrete reason. Resume from `next_step`; never infer a later state from code or conversation.

One-shot work keeps the same sequence in memory but creates no work record. If the run is interrupted, restart its readiness check.

Product mutations begin only in `approved`. Planning artifacts and the work record are allowed before approval. General requests to build, implement, finish, or continue do not grant checkpoint approval.
