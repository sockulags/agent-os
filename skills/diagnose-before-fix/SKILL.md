---
name: diagnose-before-fix
description: Finds the root cause of reproducible technical failures before code is changed. It activates when investigating a bug, regression, failing test, crash, or unexpected behavior whose cause is not yet established, before proposing or applying a fix. It skips known-cause mechanical edits, feature implementation, general review, and post-fix verification.
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
