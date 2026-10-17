---
name: diagnose-before-fix
description: Bug, crash, error, regression, or failing test whose cause is unknown. Reproduces the failure and finds the root cause before any code changes. Use when the user says things like figure out why, this broke, it returns a 500, this test is flaky, what is going on with this error, or fix this bug. Not for edits whose cause is already known, new features, code review, or checking that a finished fix works.
---

# Diagnose before fix

Find the smallest supported explanation that accounts for the failure and predicts a useful check.

## Contract

- **Ground truth:** the narrowest reliable reproduction or observed failure.
- **Working surface:** tests, diagnostics, logs, and instrumentation inside the task scope.
- **Boundary:** do not commit a production fix whose causal story is still guesswork.

## Loop

Reproduce, reduce, trace the nearest seam, and compare plausible causes with high-information checks.
Use temporary instrumentation when it helps. Once evidence supports a cause, implement the smallest
fix and add a regression check when practical. Re-run the original failing path.

If the failure cannot be reproduced or competing explanations cannot be distinguished, report the
bounded uncertainty and the next discriminating check. Do not turn a plausible hypothesis into a
confirmed diagnosis.
