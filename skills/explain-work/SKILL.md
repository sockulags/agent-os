---
name: explain-work
description: Explains the current task or plan in plain language with no technical vocabulary, so the developer can judge it beyond the jargon. User-invoked directly or as the closing gate of guide-me. Not a substitute for technical review or verification.
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

Present the summary and ask the developer to approve or challenge it. A challenge means the
understanding was wrong somewhere: name what was misunderstood and reopen the questioning or the
plan at that point rather than defending the summary. Under guide-me, approval closes the gate and
the summary becomes the `## TLDR` at the top of the receiving planning artifact.

Standalone, explain-work can run against any plan, diff, or pull request; the deliverable is the
plain-language summary itself and the developer's verdict on it.
