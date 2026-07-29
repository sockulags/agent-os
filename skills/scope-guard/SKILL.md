---
name: scope-guard
description: Detects and contains task drift while implementation or review is already in progress. It activates when unrelated work, opportunistic cleanup, extra dependencies, or broadened requirements appear beyond the agreed request or spec, before adding them to the diff. It skips initial scoping and planning, root-cause diagnosis, and verification of work already inside scope.
---

# Guard scope

Keep the active change aligned with the developer's requested outcome.

The direct request, accepted spec, and project policy define the boundary. When new work appears,
classify it:

- **Required:** the requested outcome cannot work or be verified without it. Include it and explain
  the dependency.
- **Adjacent:** useful cleanup or hardening that is not needed now. Leave it out and mention it only
  when it is actionable.
- **Conflicting:** it changes product behavior, architecture, dependencies, a public interface, or
  delivery risk. Ask the developer before crossing that boundary.

Before delivery, inspect the diff for unrelated edits. Preserve pre-existing developer work; scope
control never grants permission to revert it.
