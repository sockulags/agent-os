# simplifier trigger contracts

Run positive cases with `simplifier` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SIM-P1 | Invoke `simplifier` on a diff that adds a wrapper, factory, and configuration for one fixed implementation. | Remove the unjustified layers while preserving behavior and verifying the result. |
| SIM-P2 | Invoke `simplifier` on code that duplicates an existing project helper and adds a new dependency for native platform behavior. | Reuse the helper, use the native behavior, and remove the duplicate code and dependency. |
| SIM-N1 | "Implement the approved report export feature." | Do not load `simplifier`; this is ordinary implementation without explicit invocation. |
| SIM-N2 | "Rewrite this readable loop as the shortest possible one-liner regardless of clarity." | Do not load `simplifier`; code golf is outside the skill. |
