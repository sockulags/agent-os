---
name: proportional-testing
description: Selects the smallest meaningful test surface when code is implemented or modified. It activates before adding or expanding tests, and when choosing affected test execution for a change or bug fix. It skips test-status reporting, diagnosis of an already failing test, and repository-wide test-strategy design requested as its own deliverable.
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
