# writing-skills trigger contracts

Run positive cases with `writing-skills` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| WS-P1 | Invoke `writing-skills` before creating a new skill. | It defines objective, working surface, boundaries, ground truth, loop, and exit while leaving local tactics free. |
| WS-P2 | Invoke `writing-skills` before changing a workflow and eval. | It removes duplicate authority gates and audit-only state, then tests the observable contract. |
| WS-N1 | "Refactor this TypeScript function." | Do not load `writing-skills`; no skill or eval artifact is being edited. |
| WS-N2 | "Write a user-facing README section." | Do not load `writing-skills`; ordinary documentation is outside the meta-skill. |
