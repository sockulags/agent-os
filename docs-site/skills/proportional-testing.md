---
title: proportional-testing
description: Choose the minimum meaningful tests for a code change and its plausible regressions.
skill-description: Tests for a change or bug fix, both which tests to write and which to run. Picks the smallest test set that still guards the changed behavior and its callers, extending existing tests first. Use when the user says things like add tests for this, write a regression test, fix the bug and add a test, or which tests should I run before the PR. Not for reporting which tests failed, diagnosing a failing or flaky test, or designing a test strategy for the whole repository.
summary: Minimum meaningful regression coverage
---

# proportional-testing

**Bucket:** discipline · **Invocation:** automatic

Prevents small changes from accumulating broad, redundant, or implementation-coupled test suites.

Before adding a test, the agent identifies the changed observable behavior, searches existing
coverage, and names a realistic regression the new test would catch. If there is no clear answer,
the test is not added. Existing or table-driven tests are extended when practical.

The unit under test is a rule or a flow, not a file. Behavior that passes through several of the
project's own layers gets a flow test: it enters where a caller enters, runs the real code
underneath, and replaces only what lies outside the system, such as another service, the browser,
object storage, or the clock. A rule with many input combinations, or a branch a flow cannot reach
cheaply, gets a focused test on the code that decides it. Code that only forwards gets no test. The
level is not copied from the nearest existing test, shared setup is reused instead of copied, and
the cases a flow test replaces are deleted in the same change after the behavior has been broken
once to see the flow test fail. A flow test that needs a database is registered the way the project
runs such tests, and the report says whether the delivery gate runs it.

A test that proves the change is not automatically committed. It stays in the suite only as a
lasting guard: it protects observable behavior, no existing test, type, or lint rule already catches
the regression, and it survives a behavior-preserving refactor, so it mocks none of the project's own
modules and asserts calls only where the call is the contract at a system boundary. Otherwise it runs
as evidence, or folds into the existing case for the same rule. A touched test file is left no worse:
cases for the same rule merge into one table-driven test named by that rule, and assertions the new
case makes redundant go.

Existing cases in a touched test file, and the tests of code that is reshaped, are judged by two
imagined edits: break the behavior and the test must fail, change only the internals and it must
still pass. A case that fails either edit is rewritten to drive the public behavior, or deleted when
another case already protects that behavior or the behavior is gone. That needs no separate
approval, and each deleted test is named with its reason in the report. A large suite is no reason
to delete, and a test locked by `lock-test` stays as it is.

For a confirmed bug, one reproducing regression check is established when practical, shown to fail
for the expected reason, and rerun after the fix. Relevant affected tests follow; broader suites are
reserved for uncertain blast radius, shared infrastructure, or required repository gates.

This discipline does not weaken project-defined CI or delivery checks. See the full
[Proportional testing strategy](/reference/proportional-testing).
