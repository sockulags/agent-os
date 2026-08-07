# Proportional testing strategy

The goal is maximum confidence with the minimum necessary test surface. Test count and coverage
percentage are signals, not quality targets.

## Select the protected behavior

Understand the behavior being changed, inspect existing coverage, and identify nearby behavior that
could realistically regress. Protect:

- the observable behavior directly changed;
- important edge cases introduced or affected by the change;
- consumers that depend on a changed contract;
- relevant previously discovered regressions;
- integration boundaries actually crossed by the change.

Do not create tests merely because new code, branches, functions, files, or components exist.
Existing coverage may already be sufficient.

## Prefer durable tests

Test externally observable behavior and contracts. A behavior-preserving refactor should not force
large test rewrites. Avoid tests whose main value is asserting internal calls, exact call sequences
when ordering is not contractual, trivial delegation, getters, constructors, framework boilerplate,
private structure, or mocks that reproduce the implementation.

Before adding coverage, search for an existing behavioral test. Prefer extending it, adding a case
to a table-driven test, and reusing its fixtures. One strong regression test is better than several
tests with equivalent setup and assertions.

## Choose the cheapest sufficient level

Use a focused unit or component test when it can prove the contract. Use integration or end-to-end
tests only when the behavior depends on boundaries they exercise. Mock genuine system boundaries,
not every internal dependency.

Keep unit tests fast, deterministic, and isolated. If a test needs broad application startup,
external infrastructure, network access, substantial global state, or expensive fixtures, classify
and run it at the appropriate broader level rather than disguising it as a unit test.

Balance regression protection against execution time, maintenance, flakiness, setup complexity, and
duplication. A broader test is justified by broader risk, not by the amount of code generated.

## Fix bugs with one regression story

For a confirmed bug, when practical:

1. Add or identify the smallest check that reproduces the incorrect behavior.
2. Verify that it fails for the expected reason.
3. Implement the fix.
4. Verify that the regression check passes.
5. Run affected tests for plausible nearby regressions.

Do not generate a collection of unrelated tests merely because a bug was fixed. If an existing test
already proves the regression, use it and add no new test.

## Select execution scope

During development, start with the smallest reliable affected set. Add dependency or consumer tests
when the changed contract can affect them. Expand to broader suites when affected-test selection is
unreliable, the blast radius is uncertain, shared infrastructure changed, or repository policy and
CI strategy require it.

Narrow execution is not an excuse to ignore plausible regressions. Conversely, do not run the full
suite after every small edit when reliable focused selection exists. Required delivery checks still
run even when development checks were narrow.

## Stop adding tests

Coverage is adequate when the intended behavior is verified, plausible affected behavior and
important justified edge cases have been considered, relevant existing tests pass, and the chosen
test level is proportional to the risk.

Before adding another test, ask: **What realistic regression would this catch that existing tests
would not?** If there is no clear answer, do not add it.
