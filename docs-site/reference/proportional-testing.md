---
title: Proportional testing
description: Select regression protection by changed behavior and risk, not test count or coverage targets.
---

# Proportional testing

> Public documentation for
> [`plugins/agent-os-dev/skills/proportional-testing/references/strategy.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/proportional-testing/references/strategy.md).

The goal is maximum confidence with the minimum necessary test surface. Test count and coverage
percentage are signals, not quality targets.

## Protect behavior, not code shape

Inspect the changed observable behavior, existing coverage, and plausible blast radius. Tests should
protect the changed contract, important affected edge cases and consumers, relevant prior
regressions, and integration boundaries the change actually crosses. New functions, branches,
files, components, or AI-generated code do not automatically require new tests.

Prefer externally observable contracts over internal calls, non-contractual call order, trivial
delegation, framework boilerplate, private structure, mocks of the project's own modules, or mocks
that reproduce the implementation. A behavior-preserving refactor should not force broad test
rewrites.

Existing tests are held to the same standard when their file is touched or the code they cover is
reshaped. Break the behavior and the test must fail; change only the internals and it must still
pass. A test that fails either edit is rewritten to drive the public behavior, or deleted when
another test already protects that behavior or the behavior is gone.

## Reuse before adding

Search before writing. Prefer extending an existing behavioral test, adding a table-driven case,
and reusing existing setup. One strong regression test is better than several tests that protect the
same behavior with slightly different wording or fixtures.

Before adding another test, ask: **What realistic regression would this catch that existing tests,
types, and lint rules would not?** If there is no clear answer, do not add it.

## Choose the level that proves the behavior

Test a rule or a flow, not a file. A test file per source file, each testing its layer against a
mock of the layer below, checks that every layer calls the next one and leaves the lowest layer,
where data is filtered and written, least tested. It also grows with the code, because every
forwarding function gets a test although it decides nothing.

- **A flow through several of the project's own layers** is tested by entering where a caller
  enters and running the real code underneath, against the real database when one is involved. Only
  what lies outside the system is replaced: another service, an identity provider, the browser,
  object storage, the clock.
- **A rule with many input combinations**, or a branch a flow cannot reach cheaply such as a race or
  a rare failure, gets a focused test on the code that decides it, with mocks only at real system
  boundaries.
- **Code that only forwards** gets no test of its own.

The level is not taken from the nearest existing test. When behavior crosses layers, the agent
writes the flow test, breaks the behavior once to see it fail, and removes the cases it replaces.
Flow setup lives in one shared test-support module instead of being copied into each file. A flow
test that needs a service protects nothing unless the delivery gate runs it, so the agent registers
it the way the project runs such tests and reports whether the gate includes it.

Balance protection against execution time, maintenance, flakiness, setup complexity, and
duplication.

In one project, six unit test files with 63 cases caught 40 of 73 deliberately introduced faults in
a flow. Sixteen flow tests with 29 of the old cases kept caught 58, in fewer lines.

## Bug fixes

When practical, add or identify the smallest check that reproduces a confirmed bug, prove that it
fails for the expected reason, implement the fix, rerun the regression check, and run affected tests
for plausible nearby regressions. Existing coverage may already provide this protection; a bug fix
does not justify unrelated test generation.

## Execution scope

During development, start with a reliable affected set. Expand when the blast radius is uncertain,
shared infrastructure changed, affected-test selection is unreliable, or project policy requires a
broader gate. Narrow selection must not ignore plausible regressions, and proportional development
checks never remove required CI or delivery checks.

## Coverage across boundaries

For changed journeys crossing frontend and services, identify a narrow integration or end-to-end
check that proves the relevant boundaries together. Isolated test counts cannot establish this.
Do not require end-to-end tests for every local change or delete tests because a suite is large.
Consolidation must preserve unique regression protection. Avoid expected values calculated with
the same transformation under test. An unrelated coverage gap is an actionable follow-up, not a
reason to rewrite the suite during delivery.
