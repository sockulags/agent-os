# verify-before-done

**Bucket:** discipline · **Invocation:** automatic

Requires fresh execution evidence before the agent states that implemented work is complete, fixed,
passing or ready to ship. It activates at the completion-claim boundary after changes or validation,
including requests to mark work done or report test status. It skips diagnosis, planning, speculative
review, and status reports that make no completion claim.

## Evidence loop

1. **Enumerate the claims.** List each outcome the response is about to assert: behavior, tests,
   build, generated artifact, deployment, delivery state.
2. **Choose direct checks.** Map every claim to the closest mechanically checkable evidence, preferring
   the project's documented verify commands and acceptance path over proxies such as compilation, a
   narrow unit test, or an old CI result.
3. **Run fresh checks** against the current worktree or target state, recording the command or
   observation, the exit status and the material result.
4. **Inspect the result.** Confirm that the output proves the claim itself. A command that ran
   successfully proves only what that command exercised.
5. **Resolve gaps.** Fix failures and rerun the affected checks. When a required check cannot run,
   state the exact unverified claim and the blocker instead of calling the work complete.
6. **Report proportionally.** Lead with the verified outcome, cite the decisive evidence compactly, and
   distinguish remaining uncertainty from confirmed facts.

## Evidence strength

Use the strongest practical layer:

1. Acceptance-path observation or end-to-end test.
2. Focused automated test that exercises the changed behavior.
3. Broader build, lint, typecheck or suite result.
4. Static inspection, only when execution is impossible and the limitation is stated explicitly.

Passing a weaker layer does not substitute for a required stronger one. A green type-check is not
evidence that a rendered page looks right.

## Hard rules

A completion claim stops when any material acceptance criterion lacks fresh evidence, because partial
proof cannot establish the whole outcome.

Stale, unrelated or second-hand results are context, not verification, because the current state may
differ.

Failed and skipped checks get named with their impact, because readers must be able to tell what
remains uncertain.

Evidence stays reproducible through exact commands or observable paths, because confidence has to
survive beyond the current session.
