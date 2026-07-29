# shape-work trigger contracts

Run positive cases with `shape-work` explicitly invoked and negative cases in a fresh session without
an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SW-P1 | Invoke `shape-work` for one bounded feature with open product decisions. | It reads the repository, asks only material questions with recommendations, and produces a decision-ready contract. It visualizes only when that improves a decision. |
| SW-P2 | Invoke `shape-work` on a linked chart-work handoff. | It preserves settled decisions, follows evidence links, and asks only the remaining questions. |
| SW-N1 | "Implement this decision-ready specification." | Do not load `shape-work`; the work is ready to execute. |
| SW-N2 | "Fix this one known null check." | Do not load `shape-work`; no product interview is needed. |
