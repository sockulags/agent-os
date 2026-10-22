---
name: proportional-testing
description: Tests for a change or bug fix, both which tests to write and which to run. Picks the smallest test set that still guards the changed behavior and its callers, extending existing tests first. Use when the user says things like add tests for this, write a regression test, fix the bug and add a test, or which tests should I run before the PR. Not for reporting which tests failed, diagnosing a failing or flaky test, or designing a test strategy for the whole repository.
---

# Test proportionally

Read [references/strategy.md](references/strategy.md) before creating or expanding tests.

Protect the changed behavior and plausible regressions without optimizing for test count or coverage.

## Decision

Before adding a test:

1. Identify the observable behavior changed and its plausible blast radius.
2. Search existing tests for that behavior and affected contracts.
3. Name the realistic regression the proposed test would catch that existing coverage would not.
4. If that regression is unclear, do not add the test.
5. Otherwise extend existing or table-driven coverage when practical, using the cheapest test level
   that proves the behavior.

For a confirmed bug, establish one reproducing regression check when practical, prove it fails for
the expected reason, fix it, then run that check and relevant affected tests. Expand execution only
when the blast radius is uncertain, shared infrastructure changed, or project policy requires a
broader gate.

Do not create a test for every function, branch, file, or generated code path. Prefer observable
contracts over call sequences and private structure. This discipline controls test creation and
development-time selection; it never removes required repository or CI checks at delivery.
