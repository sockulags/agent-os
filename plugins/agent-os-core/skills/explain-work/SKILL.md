---
name: explain-work
description: Explains a task, plan, spec, diff, or an over-long explanation in short plain language with no technical vocabulary, so a developer or product owner can judge it beyond the jargon. User-invoked directly, for example to shorten the agent's own wordy answer, and used by plan-work for the summary at the top of spec.md. Not a substitute for technical review or verification.
disable-model-invocation: true
---

# Explain work

Say what the work solves as if the reader knows no technical terms, then let the reader judge it.

## The summary

Cover, in everyday language: the problem it solves, who feels that problem, what changes in their
day when it works, and what it deliberately will not do. No technical vocabulary at all. If the
summary cannot stand without a technical term, the understanding is not finished; go back and
understand before explaining. Keep it short enough to read in under a minute: a TLDR, not a report.

## Shortening an explanation

When the input is an explanation that says too much, often the agent's own previous answer, keep
only what changes the reader's next step: the outcome, the one decision they must make, and what is
not done or not verified. Drop the reasoning trail, restated context, and anything the reader did
not ask about. Keep every fact that would change a decision; shortening never hides a risk or an
unverified claim. Use the reader's language.

## In a spec

Under `plan-work`, the summary becomes the `## Summary` section at the top of `spec.md`. It is
written for the product owner who approves the spec, follows the rules above, and changes whenever
the spec changes meaning.

## After the summary

End with the summary. Do not ask for approval, confirmation, or feedback, and do not close with a
question: the reader replies only to challenge it. When the summary supports a decision that
another workflow owns, that workflow asks its one question; explain-work adds none.

A challenge means the understanding was wrong somewhere: name what was misunderstood and reopen the
questioning or the plan at that point rather than defending the summary.

Standalone, explain-work can run against any plan, spec, diff, pull request, or explanation; the
deliverable is the plain-language summary itself.
