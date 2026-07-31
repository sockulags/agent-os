---
name: dispatch-next
description: Reads live project state and selects one decision-ready next action. User-invoked for queue triage or dispatch. Not for an already selected task.
disable-model-invocation: true
---

# dispatch-next

Choose one next action from live state. The wording of the request decides whether to report the
choice or dispatch it.

## Loop

Read project policy, queue conventions, issues, pull requests, and CI. Prioritize work already in
flight when it has an actionable review or failure. Select one target using the repository's
priority rules and explain why it wins.

Route broad decision work to `chart-work`, a bounded open decision to `shape-work`, and one selected
implementation-ready issue to `deliver-work`. Route to `batch-work` only when the developer
explicitly asks to execute an existing ready issue graph as an integrated batch; issue count alone
does not choose the workflow.

“What should I do next?” is a read-only selection request. “Dispatch the next task” authorizes the
project-state changes and one launch needed to dispatch the selected target. Do not infer merge,
closure, or unrelated tracker authority from dispatch.

If nothing is decision-ready, report the closest blocker. One invocation selects at most one target;
the worker or coordinator does the work.
