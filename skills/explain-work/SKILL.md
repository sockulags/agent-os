---
name: explain-work
description: Explains the current task or plan in plain language with no technical vocabulary, so the developer can judge it beyond the jargon. User-invoked directly when a real decision needs a plain-language summary or as a plan-work aid. Not a substitute for technical review or verification.
disable-model-invocation: true
---

# Explain work

Say what the work solves as if the reader knows no technical terms — then let the developer judge
it.

## The summary

Cover, in everyday language: the problem it solves, who feels that problem, what changes in their
day when it works, and what it deliberately will not do. No technical vocabulary at all — if the
summary cannot stand without a technical term, the understanding is not finished; go back and
understand before explaining. Keep it short enough to read in under a minute: a TLDR, not a report.

## The gate

Present the summary when it is needed for an actual decision and let the developer approve or
challenge it. A challenge means the understanding was wrong somewhere: name what was misunderstood
and reopen the questioning or the plan at that point rather than defending the summary. Under
plan-work, the summary may be linked from the canonical planning artifact; it is not a general
workflow gate.

Standalone, explain-work can run against any plan, diff, or pull request; the deliverable is the
plain-language summary itself and the developer's verdict on it.
