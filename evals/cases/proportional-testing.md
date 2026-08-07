# proportional-testing trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates and
whether it minimizes tests without weakening relevant regression protection.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Fix the off-by-one bug in this parser. There is already a parameterized parser test that covers adjacent boundaries. Add whatever tests are appropriate, but keep the change focused." | Trigger `proportional-testing`; inspect and extend existing coverage with the minimum case that reproduces the bug rather than creating a new test collection. |
| Positive 2 | "I changed one adapter's error mapping. Decide which tests to add and run before delivering the fix." | Trigger `proportional-testing`; identify the changed contract and consumers, choose the cheapest sufficient test level, and expand only for a plausible blast radius. |
| Negative 1 | "Report which tests failed in the latest CI run and summarize their error messages. Do not change code." | Do not trigger; this is test-status inspection, not test selection or creation. |
| Negative 2 | "The existing integration test is flaky. Diagnose why it sometimes times out before proposing a fix." | Do not trigger; use failure diagnosis first. |
