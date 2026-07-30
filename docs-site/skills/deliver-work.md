---
title: deliver-work
description: Implement one decision-ready change against explicit boundaries and ground truth.
skill-description: Delivers one decision-ready change against explicit boundaries and ground truth. User-invoked for implementation, including as a batch worker. Not for exploration or specification-only work.
summary: Implement one change against boundaries and ground truth
---

# deliver-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:deliver-work` or `$deliver-work`

Delivers one decision-ready change against explicit boundaries and ground truth.

## Authority follows the request

An implementation request authorizes repository changes inside its scope. Planning and review
requests remain read-only apart from their requested artifacts. Merge, deploy, destructive cleanup,
and effects on external systems or people require the request or project policy to include them.

## Contract

Before editing, establish:

- the observable outcome;
- boundaries and non-goals;
- tests or observations that decide success;
- the requested delivery target.

Then inspect, classify review, implement, check, adapt, review the diff, and verify the final
candidate. The agent chooses the local method.

## Review without a review panel

Independent review is the default. It may be skipped only for a localized, low-risk fix that adds no
capability, crosses no public or sensitive boundary, and has direct regression evidence.

For material work, the agent confirms that the current session has a real reviewer launch tool before
editing. A wait tool alone is not sufficient. Without a launch mechanism, the workflow stops before
mutation with a review-required handoff.

Required review uses at least one read-only reviewer in a separate context against a frozen
candidate. One general adversarial reviewer is enough by default. Add a focused security or
compatibility reviewer only when a distinct risk needs it.

The reviewer identity must come from a successful launch-tool result in the current run. On Codex,
`spawn_agent` returns the ID before `wait_agent` may name it. Empty receiver IDs and
implementer-written `/root/...` labels are not review. The result records reviewer identity and role,
candidate identity, scope, findings, and disposition. Supported findings are fixed and re-reviewed
before final verification. If no independent reviewer can run, delivery stops with a review handoff;
self-review is not presented as independent review.

Ask only when an unresolved product decision would materially change the outcome. Reversible
implementation choices belong to the implementer.

Ordinary work creates no state artifact. Work expected to span sessions may use a compact
[work record](/reference/work-records) as resumable working memory.

Batch workers stay in their assigned task workspace and return a commit SHA, changed files, checks,
and remaining uncertainty. The coordinator owns integration, aggregate review, and aggregate
verification.
