---
title: verify-before-done
description: Fresh execution evidence before an agent calls implemented work complete or ready.
skill-description: Done, fixed, passing, or ready to merge. Runs fresh checks and shows their output before saying work is complete. Use when the user says things like is this ready to merge, did the tests pass, confirm it works, mark it done, or close it out, and before the agent itself claims that work is finished. Not for diagnosing a failure, planning tests, or progress updates that claim nothing is finished.
summary: Fresh evidence before any completion claim
---

# verify-before-done

**Bucket:** discipline · **Invocation:** automatic

Matches every material completion claim to fresh evidence from the final candidate.

Choose the closest practical checks and prefer the project's documented acceptance path. Inspect
what each result actually proves: a build cannot establish rendered behavior, and a narrow unit test
cannot establish an end-to-end flow.

Lead with the verified outcome and cite decisive checks compactly. When a material check cannot run,
name the unverified claim and its impact instead of calling the whole result complete.

## Transcript: a release claim

Trimmed from the 0.6.0 release session.

```text
Agent, before sending:
"Version 0.6.0 is released and the docs site is updated."

verify-before-done:
"Match the release and docs claims to fresh evidence."

Agent, after:
Command: gh release view v0.6.0 --json tagName,targetCommitish
Exit: 0
Result: v0.6.0 targets fb0f9fd.

Command: gh run list --commit fb0f9fd...
Exit: 0
Result: Validate success; Docs success.

Command: Invoke-WebRequest https://sockulags.github.io/agent-os/
Exit: 0
Result: HTTP 200; rendered HTML contains v0.6.0.
```
