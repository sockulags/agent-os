# Delivery contract

## Establish the contract

Read the request, repository policy, relevant code, and working-tree state. Preserve existing work.
Resolve discoverable facts yourself. Before editing, know:

- **Outcome:** the observable change requested.
- **Boundaries:** explicit non-goals and the smallest plausible change surface.
- **Ground truth:** tests or observations that can prove the outcome.
- **Delivery target:** local changes, commit, pull request, merge, or deployment as requested.

An implementation request authorizes in-scope repository edits. Ask one focused question only when
an unresolved product decision has materially different outcomes. Reversible implementation choices
belong to the implementer.

## Work loop

1. Inspect enough of the affected system to choose a coherent change.
2. Make the smallest complete implementation. Use `diagnose-before-fix` when the cause is unknown and
   `scope-guard` when discoveries threaten the boundary.
3. Run fast, relevant checks while working and adapt from their results.
4. Review the resulting diff for correctness, unnecessary complexity, and scope.
5. Add independent review when the developer or project policy requests it, or when the change is
   unusually risky: security, authentication, billing, destructive data changes, concurrency, or a
   public compatibility boundary.
6. Apply `verify-before-done` to the final candidate and deliver only to the requested boundary.

Ground truth governs the loop; no prescribed implementation sequence substitutes for it.

## Resume only when useful

Ordinary work needs no workflow record. For work expected to span sessions, keep a compact
`.agent-os/work/<slug>.md`:

```yaml
---
agent_os_work: 2
title: <work title>
status: active
next_action: <concrete continuation>
---
```

Record only Outcome, Boundaries, Ground truth, Decisions, and Evidence. Use `blocked`, `verified`, or
`delivered` when those words help the next session resume accurately. The record is working memory,
not an approval ledger.

## Batch workers

A batch task definition supplies the outcome, scope, dependencies, and checks. Work only in the
assigned task workspace, commit there, and return the head SHA, changed files, checks, and remaining
uncertainty to the coordinator. The coordinator owns integration and aggregate verification.

## Stop conditions

Stop with the exact decision or external action needed when the request does not cover it. Stop a
completion claim when ground truth fails or cannot be exercised. Otherwise continue until the
requested delivery target is reached.
