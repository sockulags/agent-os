---
title: dispatch-next
description: Read live project state and select one decision-ready next action.
skill-description: Reads live project state and selects one decision-ready next action. User-invoked for queue triage or dispatch. Not for an already selected task.
summary: Pick or dispatch one action according to the request
---

# dispatch-next

**Bucket:** workflow · **Invocation:** manual · `/agent-os:dispatch-next` or `$dispatch-next`

Reads live project state and selects one decision-ready next action.

Read the repository's queue rules, open work, pull requests, and CI. Prioritize actionable work
already in flight, then choose one target and explain why it wins.

The request wording governs action:

- “What should I do next?” selects and reports without mutation.
- “Dispatch the next task” authorizes the state changes and one launch needed for that target.

Dispatch does not imply merge, closure, or unrelated tracker actions. If nothing is ready, report
the closest blocker.

A selected implementation-ready issue routes to `deliver-work`. `batch-work` is a route only when
the developer explicitly requests integrated execution of an existing ready issue graph; multiple
issues alone do not select it.

## Transcript: one target, nothing else

Condensed illustration of the selection-versus-dispatch boundary.

```text
User:
/agent-os:dispatch-next Dispatch the next task.

Agent:
Live state: PR #41 has an unanswered review comment; EXPORT-API and
EXPORT-UI are ready; CI is green.

Selection: PR #41 wins — work already in flight with an actionable
review beats starting new work.

Dispatched: one worker on the review comment. The ready issues stay
untouched, and nothing is merged or closed under this invocation.
```
