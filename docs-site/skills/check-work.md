---
title: check-work
description: Review a code candidate independently and report or fix supported findings.
skill-description: Code review of changes, a diff, a commit, a branch, or a pull request, in a session or headless in CI. Reviews them for bugs, scope, risk, and needless complexity against the spec and the repository's REVIEW.md, reports findings first, and fixes only when the user asks for fixes. Use when the user says things like review my changes, take a look before I push, sanity-check the last commit, review this PR, or review and fix what is broken. Not for only running tests, checking git status, designing a feature before code exists, or auditing the whole repository.
summary: Independently review a candidate and report or fix supported findings
---

# check-work

**Bucket:** workflow · **Invocation:** automatic

`check-work` is the independent review workflow and can trigger from a code-review request. Its
explicit modes are `/check-work report|fix` for direct Claude, `/agent-os-dev:check-work report|fix` for
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

The workflow reuses [scope-guard](/skills/scope-guard), [simplify](/skills/simplify) review mode,
[proportional-testing](/skills/proportional-testing), [diagnose-before-fix](/skills/diagnose-before-fix),
and [verify-before-done](/skills/verify-before-done) only when their questions arise. Every result
ends with exactly `APPROVED`, `CHANGES_REQUESTED`, or `BLOCKED`.

## Review policy, specs, and CI

`REVIEW.md` at the repository root is the repository's review policy: focus areas, severity tiers,
what blocks, and limits such as a cap on minor findings. check-work reads it in every mode. When the
candidate carries `Intent-Unit: <intent-id>/<unit-key>`, the unit in `plan.md` and the spec beside it
are the review contract, so a missed acceptance example, a crossed non-goal, or an edit to an
accepted intent or spec is a finding.

`check-work ci` is report mode for a non-interactive run on a pull request, such as the
`agent-review` workflow that [init-agent-os](/skills/init-agent-os) can add. It never asks and never
edits. The CI run started in a fresh context with no part in the implementation, so it is the
independent reviewer itself and launches no other. `APPROVED` there means no blocking finding; it
never replaces the human approval that branch protection requires.

## Finding disposition

The shared [finding contract](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/check-work/references/findings.md)
requires a triggering condition, concrete consequence, and supporting evidence for blocking findings.
Material maintenance costs can qualify; line counts and equivalent designs do not. Implementers may
reject unsupported findings with a reason, but cannot dismiss an introduced defect or failed required
check as scope creep. Re-review covers fixes and plausible regressions. Optional follow-ups alone
do not prevent `APPROVED`; missing necessary evidence or decisions means `BLOCKED`.
