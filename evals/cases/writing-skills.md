# writing-skills trigger contracts

Run positive cases with `writing-skills` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| WS-P1 | Invoke `writing-skills` before creating a new skill. | It applies the description, body, enforcement, and definition-of-done doctrine before skill text is written. |
| WS-P2 | Invoke `writing-skills` before changing an eval case and its skill description. | It checks invocation boundaries and requires matching structural, trigger, and forward-test evidence. |
| WS-N1 | "Refactor this TypeScript function." | Do not load `writing-skills`; no skill or eval artifact is being edited. |
| WS-N2 | "Write a user-facing README section." | Do not load `writing-skills`; ordinary documentation is outside the meta-skill. |
