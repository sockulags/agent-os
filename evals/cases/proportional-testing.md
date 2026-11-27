# proportional-testing trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates and
whether it minimizes tests without weakening relevant regression protection.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Fix the off-by-one bug in this parser. There is already a parameterized parser test that covers adjacent boundaries. Add whatever tests are appropriate, but keep the change focused." | Trigger `proportional-testing`; inspect and extend existing coverage with the minimum case that reproduces the bug rather than creating a new test collection. |
| Positive 2 | "I changed one adapter's error mapping. Decide which tests to add and run before delivering the fix." | Trigger `proportional-testing`; identify the changed contract and consumers, choose the cheapest sufficient test level, and expand only for a plausible blast radius. |
| Negative 1 | "Report which tests failed in the latest CI run and summarize their error messages. Do not change code." | Do not trigger; this is test-status inspection, not test selection or creation. |
| Negative 2 | "The existing integration test is flaky. Diagnose why it sometimes times out before proposing a fix." | Do not trigger; use failure diagnosis first. |
| Positive EN1 | "Add tests for the discount calculation I just changed." | Trigger `proportional-testing`. The agent targets the changed behavior and its boundaries and extends existing coverage rather than proposing a broad new suite. |
| Positive EN2 | "Which tests should I run for this change before I open the PR?" | Trigger `proportional-testing`. The agent selects tests by the changed contract and its consumers, not the whole suite by default, and says what it needs to see to choose. |
| Positive EN3 | "Fix the date parsing bug and add a regression test for it." | Trigger `proportional-testing`. The agent plans one focused regression case that reproduces the bug, not a new test collection. |
| Negative EN1 | "Which tests failed in the last CI run?" | Do not trigger; this is test-status reporting. |
| Positive EN4 HO | "I refactored the price formatter. What should I test?" | Trigger `proportional-testing`. |
| Negative EN2 HO | "Set up a testing strategy for the whole monorepo." | Do not trigger; this is repository-wide test-strategy design. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 3 — cross-service journey | Change a Next.js checkout journey across two services. Existing tests mock every service boundary. Select meaningful verification. | Identify the actual cross-boundary risks and use a narrow integration or end-to-end check with independent acceptance expectations. |
| Positive 4 — evidence, not guard | Fix a date formatter bug. The only quick reproduction mocks two of the project's own modules and asserts their call order; the formatter's table-driven test file already covers neighbouring dates. | Prove the fix with the quick check as evidence, then add one row to the existing table-driven test named by the rule it protects; do not commit the mock-heavy test. |
| Positive 5 — existing coupled test | A change reshapes a price calculator. Its test file has one case that asserts the order of calls to a private helper and passes whatever total is returned, and one table-driven case that checks totals. | Judge both by the two imagined edits. Delete or rewrite the call-order case, since it survives a wrong total and breaks on an internal change, keep the table-driven case, and name the deleted test and the reason in the report without asking for separate approval. |
| Positive 6 — flow across layers | Add a rule that a saved draft belongs to one customer. The route, the use case and the repository each have a test file that mocks the layer below, and the project has a shared test-support module that sets up a migrated database and a signed-in user. | Write one flow test that enters where the caller enters and runs the real use case and repository against the database, replacing only what lies outside the system. Reuse the shared setup. Do not add a case to each of the three mocked test files. |
| Positive 7 — flow replaces mocked cases | A new flow test now covers opening and resuming a draft. Four cases in the use case's unit test assert the same behavior against a mocked store. | Break the behavior once, see the flow test fail, restore the code, and delete the four cases in the same change, naming them in the report. Keep the case for the unique-constraint race, which the flow cannot reach. |
| Positive 8 — opt-in flow test | The flow test needs PostgreSQL, and the project runs such tests through a separate opt-in runner. | Register the test with that runner and state in the report whether the delivery gate runs it; do not present a test that is skipped by default as protection. |
| Negative 3 — count-driven deletion | A large suite is green. This local change reuses an already-covered formatter; no regression gap has been identified. | Do not delete tests because the count is large or add an unrelated end-to-end suite. |
| Negative 4 — combinations stay focused | A validation rule has twelve input combinations and is decided in one pure function. | Add rows to a table-driven test on that function. Do not write twelve flow tests, and do not add a flow test only to mirror the unit test. |
| Negative 5 — forwarding function | A new adapter function creates its dependencies and calls one use case with the same arguments. The neighbouring adapters each have a test that asserts the call was forwarded. | Add no test for the forwarding. Do not copy the neighbouring test. |
