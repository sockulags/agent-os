# shape-work trigger contracts

Run positive cases with `shape-work` explicitly invoked and negative cases in a fresh session without
an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SW-P1 | Invoke `shape-work` for one bounded feature with open product decisions and a configured issue tracker. | It reads the repository, asks only material questions with recommendations, settles the product shape, and creates or reuses implementation-ready issues with outcome, boundaries, acceptance, ground truth, dependencies, evidence, and delivery target. It exposes the first claimable frontier without starting implementation. |
| SW-P2 | Invoke `shape-work` on a linked chart-work handoff. | It preserves settled decisions, follows evidence links, asks only the remaining questions, materializes the implementation issues, and reconciles their links and readiness into the origin handoff and map. The branch becomes delivery-ready only after issues exist. |
| SW-P3 | One coherent product shape needs three sequential implementation units. | Three linked issues are created with stable identities and dependency order. The ready frontier names the first issue. The workflow does not infer batch-work from the issue count. |
| SW-P4 | Retry shaping after two implementation issues already exist. | Existing issues are reused and reconciled idempotently; no duplicate issue is created. |
| SW-N1 | "Implement this decision-ready specification." | Do not load `shape-work`; the work is ready to execute. |
| SW-N2 | "Fix this one known null check." | Do not load `shape-work`; no product interview is needed. |
| SW-N3 | A researched branch is explicitly parked or rejected. | Record the disposition without creating an implementation issue. |
