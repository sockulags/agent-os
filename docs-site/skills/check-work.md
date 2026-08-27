---
title: check-work
description: Review a code candidate independently and report or fix supported findings.
skill-description: Reviews a diff, commit, branch, pull request, or completed implementation for supported correctness, scope, risk, and unnecessary-complexity findings, and in explicit fix mode applies supported in-scope fixes with verification and targeted re-review. It skips merely running tests, checking status, initial design, and repository-wide audits.
summary: Independently review a candidate and report or fix supported findings
---

# check-work

**Bucket:** workflow · **Invocation:** automatic

`check-work` is the independent review workflow and can trigger from a code-review request. Its
explicit modes are `/check-work report|fix` for direct Claude, `/agent-os:check-work report|fix` for
the Claude plugin, and `$check-work report|fix` for Codex. It carries no manual-invocation gate.

## Modes

A bare explicit invocation asks before reading code or the diff whether to report findings only or
fix authorized findings. Report mode is read-only. Fix mode reviews first, changes only supported
findings inside scope, verifies the result, and obtains targeted independent re-review. Implicit
“review this” requests use report mode; “review and fix this” requests use fix mode. Only genuinely
ambiguous authority is clarified before inspection.

## Independent review and findings

The candidate is frozen and reviewed by a fresh-context, read-only reviewer launched through a real
host reviewer tool, using the
[`deliver-work` review gate](/skills/deliver-work#review-without-a-review-panel). A wait tool alone
is not enough. If a reviewer cannot be launched or does not return, the result is
`BLOCKED`, never self-review presented as independent review.

Findings come first. Each supported actionable finding has a priority, title, exact location,
evidence and impact, and required change. Speculative and cosmetic findings are omitted. Fix mode
also reports applied fixes, fresh verification, and targeted re-review, and never implies merge,
deploy, publication, approval, or another external effect.

The workflow reuses [scope-guard](/skills/scope-guard), [simplifier-review](/skills/simplifier-review),
[proportional-testing](/skills/proportional-testing), [diagnose-before-fix](/skills/diagnose-before-fix),
and [verify-before-done](/skills/verify-before-done) only when their questions arise. Every result
ends with exactly `APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED`.
