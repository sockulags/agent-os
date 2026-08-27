---
name: check-work
description: Reviews a diff, commit, branch, pull request, or completed implementation for supported correctness, scope, risk, and unnecessary-complexity findings, and in explicit fix mode applies supported in-scope fixes with verification and targeted re-review. It skips merely running tests, checking status, initial design, and repository-wide audits.
---

# Check work

Produce a decision-ready code review of the requested candidate. Review findings before proposing
or applying changes, keep the review independent, and never turn a review into an unrequested
merge, deploy, publication, approval, comment, or other external effect.

## Select the mode

- A bare explicit `check-work` invocation asks, **before reading repository code or the diff**,
  whether the developer wants findings reported only or wants authorized findings fixed. Do not
  run tests or inspect the candidate before that answer.
- `check-work report` performs a read-only review without asking. It may run relevant checks, but
  it does not edit files or external review state.
- `check-work fix` reviews first, then fixes only supported findings inside the requested scope,
  runs relevant verification, and gets a targeted independent re-review of every changed area.
  The explicit fix request is the authority; do not ask for a second approval.
- For an implicit request, infer the mode from authority: “review this” is report-only; “review
  and fix this” is fix mode. Ask before inspection only when the requested authority is genuinely
  ambiguous.

## Review loop

1. Establish the review target, candidate identity, requested scope, non-goals, and ground truth
   from the request, repository policy, working-tree state, and relevant source and tests. A
   missing target or material unresolved product choice is a blocker, not a reason to invent scope.
2. Freeze the candidate to be reviewed. Launch a fresh-context, read-only reviewer through a real host reviewer launch tool, using the independent-review semantics in
   [`deliver-work`](../deliver-work/workflow.md#review-gate). A wait tool alone is not a launch
   mechanism. If no reviewer can be launched or the launched reviewer does not return a result,
   report `BLOCKED`; never present self-review as independent review.
3. Give the reviewer the outcome, boundaries, ground truth, candidate identity, and available
   verification evidence. Synthesize only findings supported by the code, diff, tests, policy, or
   returned review evidence. Omit speculative and cosmetic findings.
4. Apply the relevant existing disciplines only when the question needs them: use
   [`scope-guard`](../scope-guard/SKILL.md) for drift, [`simplifier-review`](../simplifier-review/SKILL.md)
   for unnecessary complexity, [`proportional-testing`](../proportional-testing/SKILL.md) when
   test adequacy is part of the finding, [`diagnose-before-fix`](../diagnose-before-fix/SKILL.md)
   when a finding's cause is not established, and [`verify-before-done`](../verify-before-done/SKILL.md)
   after fixes. These are lenses, not unconditional passes.
5. In report mode, leave the candidate unchanged. In fix mode, apply only supported, in-scope
   findings; preserve unrelated work and stop at the local authority boundary. Re-run the relevant
   checks on the final candidate and launch a targeted fresh-context read-only re-review after any
   fix. If that reviewer cannot launch or return, report `BLOCKED`.

## Findings-first result

Start with actionable findings, each containing:

- **Priority and title**;
- **Exact location** (file and line, symbol, or other precise anchor);
- **Evidence and impact**;
- **Required change**.

Then report “No actionable findings” when none are supported. Fix mode additionally reports applied
fixes, fresh verification, and targeted re-review. State the candidate identity, reviewer identity
and role, and any material unverified claim. End the response with exactly one status line:
`APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED`.
