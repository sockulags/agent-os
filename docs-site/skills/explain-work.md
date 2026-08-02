---
title: explain-work
description: Explain the current task or plan in plain language so the developer can judge it beyond the jargon.
skill-description: Explains the current task or plan in plain language with no technical vocabulary, so the developer can judge it beyond the jargon. User-invoked directly or as the closing gate of guide-me. Not a substitute for technical review or verification.
summary: Explain the task in plain language for approval
---

# explain-work

**Bucket:** workflow · **Invocation:** manual · `/explain-work` (direct Claude), `/agent-os:explain-work` (Claude plugin), or `$explain-work` (Codex)

Says what the work solves as if the reader knows no technical terms — then lets the developer judge
it.

The summary covers, in everyday language: the problem it solves, who feels that problem, what
changes in their day when it works, and what it deliberately will not do. If the summary cannot
stand without a technical term, the understanding is not finished — the fix is to go back and
understand, not to keep the term. Short enough to read in under a minute: a TLDR, not a report.

The developer approves or challenges the summary. A challenge means the understanding was wrong
somewhere: the misunderstood point is named and the questioning or plan reopens there, instead of
the summary being defended.

Under [guide-me](/skills/guide-me), approval closes the gate and the summary becomes the `## TLDR`
at the top of the receiving planning artifact. Standalone, explain-work runs against any plan,
diff, or pull request; the deliverable is the plain-language summary and the developer's verdict.
