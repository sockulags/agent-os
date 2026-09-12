---
title: scope-guard
description: Classify required, adjacent, and unrelated discoveries against both task relation and mandate before they expand an active change.
skill-description: Detects and contains task drift while implementation or review is already in progress by classifying discoveries on relation and mandate axes. It activates when required, adjacent, or unrelated work or a new decision or external action appears beyond the agreed request or spec. It skips initial scoping and planning, root-cause diagnosis, and verification of work already inside scope.
summary: Keep work inside the task; flag drift
---

# scope-guard

**Bucket:** discipline · **Invocation:** automatic

Keeps an active change aligned with the developer's requested outcome by using two axes: relation
to the mission and available mandate.

Classify discoveries on both axes:

- **Required / adjacent / unrelated:** whether the discovery is needed for correct delivery, useful
  but unnecessary now, or not relevant to the mission.
- **Covered / new decision or external action:** whether the existing request and policy already
  authorize it. A ready issue is not authorization.

Risk guides implementation and verification; it can expose a missing decision but does not itself
grant new permission. Required work normally stays in the mission. A material product or boundary
change returns to `plan-work`; adjacent work can be offered as a follow-up, and unrelated work gets
no invented proposal. Inspect the final diff for unrelated edits and preserve pre-existing
developer work.

## Transcript: useful, but not required

Trimmed from trigger case SG-P1 on 2026-07-30.

```text
User:
"While implementing this small fix you find an old module that should
be refactored. Keep the task narrow and handle the discovery correctly."

Agent:
"I am using scope-guard because the refactor is outside the active fix."

scope-guard:
"Classify the discovery by relation to the mission and by whether the current request covers it."

Agent:
"The old-module refactor is adjacent work and not needed for this fix. I
will leave it outside the patch and record it as a follow-up only if the
current mandate allows that tracker write."
```

## Local improvement and follow-ups

Cohesive behavior-preserving extraction on the touched surface is allowed. The implementer can reject
unsupported review requests with evidence. For worthwhile adjacent work, search for an existing
issue and draft the problem, impact, and acceptance condition. Create or update it only under
existing request or project-policy authority that does not conflict with an explicit read-only
instruction; otherwise ask one consolidated follow-up question.
An optional backlog decision does not delay authorized delivery. Rejected preferences need no ticket.
