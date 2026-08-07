---
title: Proportional testing
description: Select regression protection by changed behavior and risk, not test count or coverage targets.
---

# Proportional testing

> Public documentation for
> [`skills/proportional-testing/references/strategy.md`](https://github.com/sockulags/agent-os/blob/main/skills/proportional-testing/references/strategy.md).

The goal is maximum confidence with the minimum necessary test surface. Test count and coverage
percentage are signals, not quality targets.

## Protect behavior, not code shape

Inspect the changed observable behavior, existing coverage, and plausible blast radius. Tests should
protect the changed contract, important affected edge cases and consumers, relevant prior
regressions, and integration boundaries the change actually crosses. New functions, branches,
files, components, or AI-generated code do not automatically require new tests.

Prefer externally observable contracts over internal calls, non-contractual call order, trivial
delegation, framework boilerplate, private structure, or mocks that reproduce the implementation.
A behavior-preserving refactor should not force broad test rewrites.

## Reuse before adding

Search before writing. Prefer extending an existing behavioral test, adding a table-driven case,
and reusing existing setup. One strong regression test is better than several tests that protect the
same behavior with slightly different wording or fixtures.

Before adding another test, ask: **What realistic regression would this catch that existing tests
would not?** If there is no clear answer, do not add it.

## Use the cheapest sufficient level

Use a focused unit or component test when it proves the contract. Escalate to integration or
end-to-end only when the behavior genuinely depends on those boundaries. Mock real system
boundaries rather than internal implementation. Balance protection against execution time,
maintenance, flakiness, setup complexity, and duplication.

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
