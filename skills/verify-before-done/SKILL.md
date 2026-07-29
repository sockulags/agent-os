---
name: verify-before-done
description: Requires fresh execution evidence before an agent states that implemented work is complete, fixed, passing, or ready to ship. It activates at the completion-claim boundary after changes or validation, including requests to mark work done or report test status. It skips diagnosis, planning, speculative review, and status reports that make no completion claim.
---

# Verify before done

Match each material completion claim to fresh evidence from the final candidate.

## Loop

Identify the material outcomes the final response will claim. Choose the closest practical checks,
prefer the project's documented acceptance path, and run them against the final state. Inspect what
the result actually proves. Fix failures and rerun affected checks.

## Evidence strength

Use the strongest practical layer:

1. Acceptance-path observation or end-to-end test.
2. Focused automated test that exercises the changed behavior.
3. Broader build, lint, typecheck, or suite result.
4. Static inspection only when execution is impossible and the limitation is explicit.

Passing a weaker layer does not prove a stronger claim. Stale or second-hand results are context, not
verification.

Lead with the outcome and cite the decisive checks compactly. If a material check cannot run, name
the unverified claim and its impact instead of calling the whole result complete.
