---
title: diagnose-before-fix
description: Reproduce an unknown technical failure and support its cause before changing production code.
skill-description: Bug, crash, error, regression, or failing test whose cause is unknown. Reproduces the failure and finds the root cause before any code changes. Use when the user says things like figure out why, this broke, it returns a 500, this test is flaky, what is going on with this error, or fix this bug. Not for edits whose cause is already known, new features, code review, or checking that a finished fix works.
summary: Reproduce and root-cause before patching
---

# diagnose-before-fix

**Bucket:** discipline · **Invocation:** automatic

Finds a supported cause for a reproducible technical failure before committing a production fix.

Use the narrowest reliable reproduction as ground truth. Reduce the failure, trace the nearest seam,
compare plausible causes, and run high-information checks. Tests, logs, and temporary instrumentation
inside the task scope are available working surfaces.

When the failure can be captured as an automated test, the test comes first and must fail for the
diagnosed reason. In a delivery that commits, the failing test is committed before the fix and, with
agent-os-dev guard hooks installed, locked with `guards.mjs lock-test <path>` from quality-ratchet's
`scripts/`, so the test cannot be bent to fit the fix. It is unlocked with `unlock-test` once the fix
passes. Changing a locked test needs the developer's explicit agreement. See
[Guard hooks](/reference/guards).

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
