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

Before editing each unit, verify that it is one coherent implementation issue or an equivalently
bounded direct request: one observable outcome, one reviewable change boundary, explicit ground
truth, and satisfied dependencies. If an unshaped target contains several separately closable outcomes,
different delivery targets, or unresolved product choices, stop before mutation and return it for
shaping into implementation-ready issues. Do not choose `batch-work`; execution strategy belongs to
the developer.

When the request explicitly covers a bounded set of already shaped issues, deliver one ready unit
at a time and continue sequentially within that authority. Re-read dependencies and project state
after each unit; stop for a material unresolved decision or an exhausted ready frontier. This repeats
the active delivery contract, not `dispatch-next` or an implicit batch. An undecomposed epic still
needs shaping; a one-issue request does not authorize the rest of its epic. Keep one active quality
baseline for the authorized sequence and refresh its check per candidate; do not call `begin` again
for each unit while that baseline is active.

The same rule applies when the request names a planned feature or epic: delivery owns the complete
authorized result, not merely whichever child happens to be green. When the request covers an epic,
run its aggregate verification and report the final verification owner. Child success never closes
the parent or grants authority over its siblings.

## Work loop

1. Inspect enough of the affected system to choose a coherent change. Apply quality-ratchet's
   reuse and responsibility guidance before writing. If a solution-changing uncertainty remains,
   use the [experiment decision](../plan-work/references/prototypes.md); clear tasks need no prototype.
2. If available, run [`quality-ratchet`](../quality-ratchet/SKILL.md)'s `begin` before the first
   mutation. It captures the exact worktree entry state without stashing or editing user files; an
   unavailable capability is reported rather than turned into a substitute gate.
3. Classify the review gate before editing. If review is required, confirm the current tool list
   contains a real reviewer launch tool before mutation. Re-evaluate the gate against the completed
   diff.
4. Make the smallest complete implementation. Allow only the quality-ratchet's bounded,
   behavior-preserving improvement on the touched surface. Use `diagnose-before-fix` when the
   cause is unknown and `scope-guard` when discoveries threaten the boundary.
5. Apply [`proportional-testing`](../proportional-testing/SKILL.md) when selecting or creating tests.
   Run fast, relevant checks while working and adapt from their results.
6. Before [`simplifier-review`](../simplifier-review/SKILL.md), run quality-ratchet's `check` when
   its baseline is active and pass the evidence to the semantic review. Treat file, NLOC, legacy,
   dependency, and analyzer values as signals, never as an aggregate score or threshold gate.
7. Review the resulting diff for correctness, unnecessary complexity, and scope. Apply the
   simplifier-review lens and resolve findings using the
   [finding contract](../check-work/references/findings.md) before freezing the candidate.
8. Complete the review gate below.
9. Apply `verify-before-done` to the final candidate and deliver only to the requested boundary.

Ground truth governs the loop; no prescribed implementation sequence substitutes for it.

## Handle discoveries without fragmenting the mission

During delivery, update the current work when the discovery is necessary and within the existing
contract:

- a necessary technical detail is solved and delivery continues;
- a missed technical prerequisite is added to the work plan and delivery continues within mandate;
- an incorrect order is corrected when acceptance, ownership, and delivery boundaries remain the
  same;
- a unit is split, combined, or has responsibility moved only through targeted `shape-work`;
- a product contract or explicit boundary is changed only by reopening that decision through
  `plan-work`;
- an adjacent improvement stays out without separate authority.

Diagnose technical blockers before forwarding them. Do not create a blocking side issue merely
because a necessary detail was discovered late. Continue independent authorized work during a
partial block. A context or session limit calls for a compact continuation record, not a new
product issue. Changing workflow names is not itself a new approval step.

No workflow grants tracker write access automatically. Tracker maintenance is allowed only when the
request or project policy grants it, and then only for implementation detail and technical
ordering/readiness inside the authorized set. It does not include changing acceptance, owners,
delivery scope, adding unrequested work, or closing an issue. A ready issue is not authorization.
Without tracker mandate, keep corrections local and report the delta. If it must survive a session,
use the work record's existing sections and add `Pending tracker updates` only when needed; record
the unsynced delta, never a copied plan.

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
   `spawn_agent`; copy its returned ID, then use the host wait mechanism and correlate the returned
   result to that identity. Follow the actual wait-tool schema; not every host accepts an ID argument.
   If `spawn_agent` is not
   callable or returns no ID, stop without calling a wait tool. Never call a wait tool with empty
   receiver IDs or construct a `/root/...` reviewer label yourself. Use the host's equivalent launch
   receipt elsewhere. Give the reviewer the outcome, boundaries, ground truth, candidate diff, and
   verification evidence — not the implementer's reasoning.
4. Use one general evidence-based reviewer by default, briefed with the finding contract above.
   Add a focused security or compatibility reviewer
   only when a distinct risk needs that lens; do not create a panel by default.
5. Accept review only when that launched identity returns a result. Record the reviewer identity and
   role, candidate identity, reviewed scope, findings, and disposition. This is completion evidence,
   not an approval ledger.
6. Adjudicate findings using that contract and `scope-guard`; fix supported in-scope problems and
   explain rejected requests. If the candidate changes, run targeted re-review before final
   verification. Refresh active quality-ratchet evidence after the last correction so Stop need
   not request an extra turn merely to update stale evidence.

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
`delivered` when those words help the next session resume accurately. Add `Pending tracker updates`
only when an authorized or reported tracker delta needs to survive the session. The record is working memory,
not an approval ledger, plan copy, or audit receipt.

## Batch workers

A batch task definition supplies the outcome, scope, dependencies, and checks. Work only in the
assigned task workspace, commit there, and return the head SHA, changed files, checks, and remaining
uncertainty to the coordinator. The coordinator owns integration, aggregate review, and aggregate
verification.

## Stop conditions

Stop with the exact decision or external action needed when the request does not cover it. Stop a
completion claim when ground truth fails or cannot be exercised. Otherwise continue until the
requested delivery target is reached.
