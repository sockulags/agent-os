# scope-guard

**Bucket:** discipline · **Invocation:** automatic

Detects and contains task drift while implementation or review is already in progress. It activates
when unrelated work, opportunistic cleanup, extra dependencies or broadened requirements appear beyond
the agreed request or spec, before they are added to the diff. It skips initial scoping and planning,
root-cause diagnosis, and verification of work already inside scope.

The aim is to keep the active change aligned with its authorized outcome while preserving discoveries
for a later decision.

## Scope loop

1. **Restate the boundary.** Derive the authorized outcome, acceptance criteria, explicit non-goals
   and permitted mutation surface from the current request, approved spec and project policy.
2. **Inspect the discovery.** Describe the newly found work without implementing it, and identify
   whether it is required for an acceptance criterion or merely useful nearby work.
3. **Classify it** as exactly one of:
   - **Required** — the requested outcome cannot work or be verified without it.
   - **Adjacent** — valuable follow-up, cleanup or hardening that is not required now.
   - **Conflicting** — it changes the agreed behavior, architecture, dependency set, public interface
     or delivery risk.
4. **Act on the class.** Required work stays in the current diff with its dependency explained.
   Adjacent work is preserved as a concise proposal or issue candidate, with no mutation for it.
   Conflicting work pauses for a user decision.
5. **Audit the diff.** Before delivery, map every changed file and dependency to an acceptance
   criterion or a required enabling step, and remove unrelated edits through a safe, non-destructive
   edit.
6. **Report the edge:** what stayed in scope, what was deferred, and any decision still needed.

## Hard rules

Adding a dependency, public-interface change, migration or unrelated cleanup without authorization
stops first, because these materially expand risk and review cost.

User-owned pre-existing work is preserved even when it sits outside the task, because scope control
does not authorize reverting someone else's changes.

A required enabling change counts as in scope only when its causal link to an acceptance criterion is
explicit, because "while here" is not a requirement.

Deferred discoveries stay actionable and brief, because hidden work is lost while implemented extras
pollute the current diff.
