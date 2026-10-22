---
name: verify-before-done
description: Done, fixed, passing, or ready to merge. Runs fresh checks and shows their output before saying work is complete. Use when the user says things like is this ready to merge, did the tests pass, confirm it works, mark it done, or close it out, and before the agent itself claims that work is finished. Not for diagnosing a failure, planning tests, or progress updates that claim nothing is finished.
---

# Verify before done

Match each material completion claim to fresh evidence from the final candidate.

## Loop

Identify the material outcomes the final response will claim. Choose the closest practical checks,
prefer the ground truth named in the accepted spec, the required checks in `.agent-os/quality.json`,
or the project's documented acceptance path, and run them against the final state. Inspect what
the result actually proves. Fix failures and rerun affected checks.

## Evidence strength

Use the strongest practical layer:

1. Acceptance-path observation or end-to-end test.
2. Focused automated test that exercises the changed behavior.
3. Broader build, lint, typecheck, or suite result.
4. Static inspection only when execution is impossible and the limitation is explicit.

Passing a weaker layer does not prove a stronger claim. Stale or second-hand results are context, not
verification.

When agent-os-dev is installed, a quality-ratchet Stop block saying the check is stale or a required
check failed is this discipline enforced: rerun the check, or name the claim as unverified.

Lead with the outcome and cite the decisive checks compactly. If a material check cannot run, name
the unverified claim and its impact instead of calling the whole result complete.
