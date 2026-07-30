---
title: scope-guard
description: Classify required, adjacent, and conflicting discoveries before they expand an active change.
skill-description: Detects and contains task drift while implementation or review is already in progress. It activates when unrelated work, opportunistic cleanup, extra dependencies, or broadened requirements appear beyond the agreed request or spec, before adding them to the diff. It skips initial scoping and planning, root-cause diagnosis, and verification of work already inside scope.
summary: Keep work inside the task; flag drift
---

# scope-guard

**Bucket:** discipline · **Invocation:** automatic

Keeps an active change aligned with the developer's requested outcome.

Classify discoveries:

- **Required:** needed for the outcome or its verification; include it.
- **Adjacent:** useful but unnecessary now; leave it out.
- **Conflicting:** changes product behavior, architecture, dependencies, a public interface, or
  delivery risk; ask before crossing the boundary.

Inspect the final diff for unrelated edits and preserve pre-existing developer work.

## Transcript: useful, but not required

Trimmed from trigger case SG-P1 on 2026-07-30.

```text
User:
"While implementing this small fix you find an old module that should
be refactored. Keep the task narrow and handle the discovery correctly."

Agent:
"I am using scope-guard because the refactor is outside the active fix."

scope-guard:
"Classify the discovery before adding it to the diff."

Agent:
"The old-module refactor is adjacent work. I will leave it outside the
fix and record it as a separate follow-up without changing architecture,
dependencies, or unrelated code."
```
