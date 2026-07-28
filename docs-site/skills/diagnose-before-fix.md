# diagnose-before-fix

**Bucket:** discipline · **Invocation:** automatic

Finds the root cause of a reproducible technical failure before code is changed. It activates when
investigating a bug, regression, failing test, crash or unexpected behavior whose cause is not yet
established, before a fix is proposed or applied. It skips known-cause mechanical edits, feature
implementation, general review, and post-fix verification.

The goal is the smallest explanation that accounts for the observed failure and predicts a useful
test.

## Diagnostic loop

1. **State the symptom.** Record expected behavior, actual behavior, environment and the narrowest
   known failing path. Keep observations separate from interpretations.
2. **Reproduce.** Run the smallest reliable reproduction. For an intermittent failure, capture
   frequency and conditions instead of treating one pass as disproof.
3. **Reduce.** Remove unrelated inputs, layers and timing until the failure boundary is clear. Compare
   a working case with the failing case where possible.
4. **Trace the seam.** Follow data and control flow across the nearest boundary — caller/callee,
   client/server, parser/input, state/event, configuration/runtime — and instrument that boundary
   rather than guessing inside it.
5. **Form competing hypotheses.** Write the leading explanation and at least one plausible
   alternative, and for each choose a check whose result would distinguish them.
6. **Falsify cheaply.** Run the highest-information checks first, update the hypotheses from evidence,
   and avoid accumulating speculative edits.
7. **Name the root cause:** the faulty condition, why it produces the symptom, and the evidence that
   excludes the closest alternative.
8. **Cross the patch gate.** Only then propose or implement a fix, add a regression check that fails
   for the diagnosed reason, and verify the fix through the original reproduction.

## Hard rules

Production files stay unchanged until evidence supports a root cause, because an early patch destroys
diagnostic information and can mask the defect.

One diagnostic variable changes at a time, because bundled experiments cannot identify which condition
mattered.

When the failure cannot be reproduced or distinguished with the available evidence, the agent stops
and reports bounded uncertainty, because a hypothesis is not a diagnosis.

The original failing path gets re-run after the patch, because a passing proxy does not prove the
reported symptom is resolved.
