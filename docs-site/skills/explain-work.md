---
title: explain-work
description: Explain the current task or plan in plain language so the developer can judge it beyond the jargon.
skill-description: Explains a task, plan, spec, diff, or an over-long explanation in short plain language with no technical vocabulary, so a developer or product owner can judge it beyond the jargon. User-invoked directly, for example to shorten the agent's own wordy answer, and used by plan-work for the summary at the top of spec.md. Not a substitute for technical review or verification.
summary: Explain or shorten work in plain language
---

# explain-work

**Bucket:** workflow · **Invocation:** manual · `/explain-work` (direct Claude), `/agent-os-core:explain-work` (Claude plugin), or `$explain-work` (Codex)

Says what the work solves as if the reader knows no technical terms, then lets the developer judge
it.

The summary covers, in everyday language: the problem it solves, who feels that problem, what
changes in their day when it works, and what it deliberately will not do. If the summary cannot
stand without a technical term, the understanding is not finished; the fix is to go back and
understand, not to keep the term. Short enough to read in under a minute: a TLDR, not a report.

The summary is the end of the response. It never asks for approval or closes with a question: the
developer replies only to challenge it, and a workflow that owns a pending decision asks its own one
question. A challenge means the understanding was wrong somewhere: the misunderstood point is named
and the questioning or plan reopens there, instead of the summary being defended.

Explain-work also shortens an explanation that says too much, often the agent's own previous answer.
It keeps the outcome, the one decision the reader must make, and what is not done or not verified,
and drops the reasoning trail and restated context. Shortening never hides a risk or an unverified
claim.

Under [plan-work](/skills/plan-work), the summary becomes the `## Summary` section at the top of
`spec.md`, written for the owner who approves the spec; it is not a general approval gate.
Standalone, explain-work runs against any plan, spec, diff, pull request, or explanation; the
deliverable is the plain-language summary.
