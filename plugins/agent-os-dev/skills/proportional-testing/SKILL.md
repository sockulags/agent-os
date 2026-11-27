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
3. Name the realistic regression the proposed test would catch that existing tests, types, and lint
   rules would not.
4. If that regression is unclear, do not add the test.
5. Otherwise extend existing or table-driven coverage when practical, at the level chosen below.

## Choose the level

The unit under test is a rule or a flow, not a file. Do not add a test because a source file has
none, and do not copy the level of the nearest existing test: a suite of file-by-file tests shows
what was written before, not what proves the behavior.

- Behavior that passes through several of the project's own layers is proven by a flow test. Enter
  where a caller enters, run the real code underneath, and replace only what lies outside the
  system, such as another service, the browser, object storage, or the clock. A test that replaces
  the project's own layer with a mock proves that the layer above calls it, not that the behavior
  works.
- A rule with many input combinations, or a branch a flow cannot reach cheaply such as a race or a
  rare failure, gets a focused test on the code that decides it, also without mocking the project's
  own modules.
- Code that only forwards to another function gets no test of its own.

Reuse the project's shared test setup for flows and extend it when it lacks what the flow needs; do
not copy schema or fixture setup into the new file. When a flow test replaces existing cases, break
the behavior they guarded once, see the flow test fail, restore the code, and delete those cases in
the same change.

A test that is skipped by default protects nothing. When a flow test needs a database or another
service, register it the way the project runs such tests, and say in the report whether the
delivery gate runs it.

Decide whether a test is evidence for this change or a lasting guard. Commit it only when it protects
externally observable behavior and survives a behavior-preserving refactor: it mocks none of the
project's own modules, and it asserts call order or arguments only where that call is the contract at
a system boundary. Otherwise run it as evidence and do not commit it, or fold it into the existing
case for the same rule.

Leave a touched test file no worse than you found it. When you add a case, merge cases that test the
same rule into one table-driven test, name tests by the rule they protect rather than the issue that
added them, and remove assertions the new case makes redundant.

Judge the existing cases in a test file you touch, and the tests of code you reshape, by two
imagined edits. Break the behavior: the test must fail. Change only the internals: the test must
still pass. Rewrite a case that fails either edit so it drives the public behavior, or delete it
when another case already protects that behavior or the behavior is gone. This needs no separate
approval; name each deleted test and its reason in the report. A large suite is no reason to delete,
and a test locked by `lock-test` stays as it is.

For a confirmed bug, establish one reproducing regression check when practical, prove it fails for
the expected reason, fix it, then run that check and relevant affected tests. Expand execution only
when the blast radius is uncertain, shared infrastructure changed, or project policy requires a
broader gate.

Do not create a test for every function, branch, file, or generated code path. This discipline
controls test creation and development-time selection; it never removes required repository or CI
checks at delivery.
