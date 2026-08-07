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

## Confirm one delivery unit

Before editing, verify that the target is one coherent implementation issue or an equivalently
bounded direct request: one observable outcome, one reviewable change boundary, explicit ground
truth, and satisfied dependencies. If the target contains several separately closable outcomes,
different delivery targets, or unresolved product choices, stop before mutation and return it for
shaping into implementation-ready issues. Do not choose `batch-work`; execution strategy belongs to
the developer.

## Work loop

1. Inspect enough of the affected system to choose a coherent change.
2. Classify the review gate before editing. If review is required, confirm the current tool list
   contains a real reviewer launch tool before mutation. Re-evaluate the gate against the completed
   diff.
3. Make the smallest complete implementation. Use `diagnose-before-fix` when the cause is unknown and
   `scope-guard` when discoveries threaten the boundary.
4. Apply [`proportional-testing`](../proportional-testing/SKILL.md) when selecting or creating tests.
   Run fast, relevant checks while working and adapt from their results.
5. Review the resulting diff for correctness, unnecessary complexity, and scope. Apply the
   [`simplifier-review`](../simplifier-review/SKILL.md) lens and fix supported simplification
   findings before freezing the candidate.
6. Complete the review gate below.
7. Apply `verify-before-done` to the final candidate and deliver only to the requested boundary.

Ground truth governs the loop; no prescribed implementation sequence substitutes for it.

## Review gate

Independent review is required unless the final candidate is a small fix and all of these are true:

- it corrects one localized defect with a supported cause and adds no capability;
- it changes no public API, schema, protocol, or compatibility boundary;
- it touches no security, authentication, authorization, credentials, secrets, tokens, billing,
  external writes, destructive data change, migration, or concurrency behavior;
- direct regression evidence covers the changed behavior.

A developer or project policy may require review for any change. Only an explicit instruction may
waive required review; do not solicit a waiver. When review is required:

1. Before editing, verify that the current session exposes `spawn_agent` or an equivalent reviewer
   launch tool. A wait tool alone is not a launch mechanism. If no launch tool exists, stop before
   mutation with a review-required handoff.
2. Freeze the candidate. Identify it by commit when available, otherwise by the current diff and
   changed-file set.
3. Launch at least one read-only reviewer in a context that has not inherited the implementation
   conversation. On Codex, the next review tool action after freezing the candidate must be
   `spawn_agent`; copy its returned ID, then call `wait_agent` with that ID. If `spawn_agent` is not
   callable or returns no ID, stop without calling a wait tool. Never call a wait tool with empty
   receiver IDs or construct a `/root/...` reviewer label yourself. Use the host's equivalent launch
   receipt elsewhere. Give the reviewer the outcome, boundaries, ground truth, candidate diff, and
   verification evidence — not the implementer's reasoning.
4. Use one general adversarial reviewer by default. Add a focused security or compatibility reviewer
   only when a distinct risk needs that lens; do not create a panel by default.
5. Accept review only when that launched identity returns a result. Record the reviewer identity and
   role, candidate identity, reviewed scope, findings, and disposition. This is completion evidence,
   not an approval ledger.
6. Fix supported in-scope findings. If the candidate changes, run targeted re-review before final
   verification.

A reviewer label written by the implementer, a wait call with no launched receiver, a self-review,
or an unreturned reviewer is not independent review. If the host exposes no launch tool, launch
fails, or no launched reviewer returns a result, stop before delivery with a review handoff
containing the frozen candidate, review scope including unnecessary solution complexity, and
required ground truth. Self-review never
substitutes for required independent review.

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
uncertainty to the coordinator. The coordinator owns integration, aggregate review, and aggregate
verification.

## Stop conditions

Stop with the exact decision or external action needed when the request does not cover it. Stop a
completion claim when ground truth fails or cannot be exercised. Otherwise continue until the
requested delivery target is reached.
