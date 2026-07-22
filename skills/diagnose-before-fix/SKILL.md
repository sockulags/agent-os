---
name: diagnose-before-fix
description: Finds the root cause of reproducible technical failures before code is changed. It activates when investigating a bug, regression, failing test, crash, or unexpected behavior whose cause is not yet established, before proposing or applying a fix. It skips known-cause mechanical edits, feature implementation, general review, and post-fix verification.
---

# Diagnose before fix

Establish a supported cause before changing production code. The goal is the smallest explanation that accounts for the observed failure and predicts a useful test.

## Diagnostic loop

1. **State the symptom.** Record expected behavior, actual behavior, environment, and the narrowest known failing path. Separate observations from interpretations.
2. **Reproduce.** Run the smallest reliable reproduction. If the failure is intermittent, capture frequency and conditions instead of treating one pass as disproof.
3. **Reduce.** Remove unrelated inputs, layers, and timing until the failure boundary is clear. Compare a working case with the failing case when possible.
4. **Trace the seam.** Follow data and control flow across the nearest boundary: caller/callee, client/server, parser/input, state/event, or configuration/runtime. Instrument the boundary rather than guessing inside it.
5. **Form competing hypotheses.** Write the leading explanation and at least one plausible alternative. For each, choose a check whose result would distinguish them.
6. **Falsify cheaply.** Run the highest-information checks first. Update the hypotheses from evidence; avoid accumulating speculative edits.
7. **Name the root cause.** Identify the faulty condition, why it produces the symptom, and the evidence that excludes the closest alternative.
8. **Cross the patch gate.** Propose or implement a fix only after the cause is supported. Add a regression check that fails for the diagnosed reason, then verify the fix through the original reproduction.

## Hard rules

- Keep production files unchanged until evidence supports a root cause, because an early patch destroys diagnostic information and can mask the defect.
- Change one diagnostic variable at a time, because bundled experiments cannot identify which condition mattered.
- Stop and report bounded uncertainty when the failure cannot be reproduced or distinguished with available evidence, because a hypothesis is not a diagnosis.
- Re-run the original failing path after the patch, because a passing proxy does not prove the reported symptom is resolved.
