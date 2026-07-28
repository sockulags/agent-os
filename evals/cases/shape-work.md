# shape-work trigger contracts

Run positive cases with `shape-work` explicitly invoked and negative cases in a fresh session without
an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SW-P1 | Invoke `shape-work` for one bounded feature with open product decisions. | It reads the repository, interviews one decision at a time, and produces a decision-complete spec with the required visualization. |
| SW-P2 | Invoke `shape-work` on a linked chart-work handoff. | It preserves settled decisions, follows evidence links, and asks only the remaining questions. |
| SW-N1 | "Implement this already approved specification." | Do not load `shape-work`; the work is decision-ready. |
| SW-N2 | "Fix this one known null check." | Do not load `shape-work`; no product interview is needed. |
