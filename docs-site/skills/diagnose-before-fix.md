---
title: diagnose-before-fix
description: Reproduce an unknown technical failure and support its cause before changing production code.
skill-description: Finds the root cause of reproducible technical failures before code is changed. It activates when investigating a bug, regression, failing test, crash, or unexpected behavior whose cause is not yet established, before proposing or applying a fix. It skips known-cause mechanical edits, feature implementation, general review, and post-fix verification.
summary: Reproduce and root-cause before patching
---

# diagnose-before-fix

**Bucket:** discipline · **Invocation:** automatic

Finds a supported cause for a reproducible technical failure before committing a production fix.

Use the narrowest reliable reproduction as ground truth. Reduce the failure, trace the nearest seam,
compare plausible causes, and run high-information checks. Tests, logs, and temporary instrumentation
inside the task scope are available working surfaces.

Once evidence supports a cause, implement the smallest fix and rerun the original failing path. When
the cause cannot be distinguished, report bounded uncertainty and the next useful check rather than
presenting a hypothesis as a diagnosis.

## Transcript: no reproducible system

Trimmed from trigger case DBF-P1 on 2026-07-30.

```text
User:
"Login started returning 500 after the last change. Find why and fix the cause."

diagnose-before-fix:
"Reproduce before proposing a production patch."

Command: rg --files
Exit: 0
Result: README.md and AGENTS.md only.

Command: git status --short
Exit: 1
Result: not a Git repository.

Agent:
"The cause cannot be established here. I need the application code and
the 500 stack trace or the last diff; otherwise a fix would be guesswork."
```
