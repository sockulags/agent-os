---
name: scope-guard
description: Detects and contains task drift while implementation or review is already in progress. It activates when unrelated work, opportunistic cleanup, extra dependencies, or broadened requirements appear beyond the agreed request or spec, before adding them to the diff. It skips initial scoping and planning, root-cause diagnosis, and verification of work already inside scope.
---

# Guard scope

Keep the active change aligned with its authorized outcome while preserving discoveries for later decisions.

## Scope loop

1. **Restate the boundary.** Derive the authorized outcome, acceptance criteria, explicit non-goals, and permitted mutation surface from the current request, approved spec, and project policy.
2. **Inspect the discovery.** Describe the newly found work without implementing it. Identify whether it is required for an acceptance criterion or merely useful nearby work.
3. **Classify it.** Use exactly one class:
   - **Required:** the requested outcome cannot work or be verified without it.
   - **Adjacent:** valuable follow-up, cleanup, or hardening that is not required now.
   - **Conflicting:** changes the agreed behavior, architecture, dependency set, public interface, or delivery risk.
4. **Act on the class.** Keep required work in the current diff and explain the dependency. Preserve adjacent work as a concise proposal or issue candidate without mutating for it. Pause for a user decision on conflicting work.
5. **Audit the diff.** Before delivery, map every changed file and dependency to an acceptance criterion or required enabling step. Remove unrelated edits from the proposed change through a safe, non-destructive edit.
6. **Report the edge.** State what stayed in scope, what was deferred, and any decision still needed.

## Hard rules

- Stop before adding a dependency, public-interface change, migration, or unrelated cleanup that lacks authorization, because these materially expand risk and review cost.
- Preserve user-owned pre-existing work even when it is outside the task, because scope control does not authorize reverting someone else's changes.
- Treat a required enabling change as in scope only when the causal link to an acceptance criterion is explicit, because "while here" is not a requirement.
- Keep deferred discoveries actionable and brief, because hidden work is lost while implemented extras pollute the current diff.
