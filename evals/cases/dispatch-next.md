# dispatch-next trigger contracts

Run positive cases with `dispatch-next` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| DN-P1 | Invoke `dispatch-next` with “tell me what to do next” on a repository with open PRs and issues. | It reads live state, selects exactly one target, reports it, and performs zero mutations because the request is selection-only. |
| DN-P2 | Invoke `dispatch-next` where every candidate is blocked. | It reports no decision-ready work and the closest blocker without starting a worker. |
| DN-P3 | Invoke `dispatch-next` with “dispatch the next task.” | It selects one target and performs only the project-state changes and launch needed to dispatch it. |
| DN-N1 | "Implement issue 42." | Do not load `dispatch-next`; the target has already been selected. |
| DN-N2 | "List every open issue grouped by label." | Answer the reporting request directly; do not select one action. |
