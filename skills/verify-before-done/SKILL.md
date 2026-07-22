---
name: verify-before-done
description: Requires fresh execution evidence before an agent states that implemented work is complete, fixed, passing, or ready to ship. It activates at the completion-claim boundary after changes or validation, including requests to mark work done or report test status. It skips diagnosis, planning, speculative review, and status reports that make no completion claim.
---

# Verify before done

Turn completion claims into evidence-backed statements. Apply this discipline immediately before reporting that work is done, fixed, passing, or ready.

## Evidence loop

1. **Enumerate the claims.** List each outcome the response is about to assert: behavior, tests, build, generated artifact, deployment, or delivery state.
2. **Choose direct checks.** Map every claim to the closest mechanically checkable evidence. Prefer the project's documented verify commands and acceptance path over proxies such as compilation, a narrow unit test, or an old CI result.
3. **Run fresh checks.** Execute the checks against the current worktree or target state. Record the command or observation, exit status, and material result.
4. **Inspect the result.** Confirm that the output proves the claim itself. A command that ran successfully proves only what that command exercised.
5. **Resolve gaps.** Fix failures and rerun the affected checks. If a required check cannot run, state the exact unverified claim and blocker instead of calling it complete.
6. **Report proportionally.** Lead with the verified outcome, cite the decisive evidence compactly, and distinguish remaining uncertainty from confirmed facts.

## Evidence strength

Use the strongest practical layer:

1. Acceptance-path observation or end-to-end test.
2. Focused automated test that exercises the changed behavior.
3. Broader build, lint, typecheck, or suite result.
4. Static inspection only when execution is impossible and the limitation is explicit.

Passing a weaker layer does not substitute for a required stronger layer.

## Hard rules

- Stop a completion claim when any material acceptance criterion lacks fresh evidence, because partial proof cannot establish the whole outcome.
- Treat stale, unrelated, or second-hand results as context rather than verification, because the current state may differ.
- Name failed and skipped checks with their impact, because readers must be able to tell what remains uncertain.
- Keep evidence reproducible by reporting exact commands or observable paths, because confidence must survive beyond the current session.
