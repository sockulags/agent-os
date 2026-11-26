# shape-work trigger contracts

Run positive cases with `shape-work` explicitly invoked and negative cases in a fresh session without
an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SW-P1 | Invoke `shape-work` for one bounded feature with open product decisions and a configured issue tracker. | It reads the repository, asks only material questions with recommendations, settles the product shape, and creates or reuses implementation-ready issues with outcome, boundaries, acceptance, ground truth, dependencies, evidence, and delivery target. It exposes the first claimable frontier without starting implementation. |
| SW-P2 | Invoke `shape-work` on a linked plan-work handoff. | It preserves settled decisions, follows evidence links, asks only the remaining questions, materializes the implementation issues, and reconciles their links and readiness into the origin handoff and map. The branch becomes delivery-ready only after issues exist. |
| SW-P3 | One coherent product shape needs three sequential implementation units. | Three linked issues are created with stable identities and dependency order. The ready frontier names the first issue. The workflow does not infer batch-work from the issue count. |
| SW-P4 | Retry shaping after two implementation issues already exist. | Existing issues are reused and reconciled idempotently; no duplicate issue is created. |
| SW-P10 Issues only | Invoke `shape-work` for a bounded feature with no intent folder, in a repository whose host issue tracker the session can write and whose project policy has no `## Tracker mandate`. | It creates the implementation issues, each opening with why the work is needed and carrying the full unit contract. It writes no `intent.md`, `spec.md`, or `plan.md`, and changes no other issue. |
| SW-P11 No writable tracker | The same feature in a repository where no tracker can be written. | It returns each issue's text in the reply for the person to create and writes no file. |
| SW-N1 | "Implement this decision-ready specification." | Do not load `shape-work`; the work is ready to execute. |
| SW-N2 | "Fix this one known null check." | Do not load `shape-work`; no product interview is needed. |
| SW-N3 | A researched branch is explicitly parked or rejected. | Record the disposition without creating an implementation issue. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| SW-P5 Open interface | Shape a settings interaction whose spec's `## Interface` section leaves the layout open between two options with a consequential usability tradeoff. | Do not sketch or pick a layout. Return the open interface question to `plan-work`, keep the unit that builds the screen blocked on it, and shape the units the question does not touch. |
| SW-P6 Settled interface | The spec's `## Interface` section records a decided screen with its sketch location. | Link the Interface section from the unit that builds the screen without restating it or reopening the design. |
| SW-P7 Self-contained unit | Shape an accepted spec whose Behavior section holds numbered examples, in a repository with existing code for the feature. | Each unit writes out its acceptance as concrete checks citing the spec examples, names real modules or interfaces to extend, and says what it consumes from each dependency. No unit's acceptance is only a pointer such as "behaviors 1 to 3". A worker given one unit and the repository can say what done means without opening the spec. |
| SW-P8 Shared example | One spec example needs behavior in two units, such as a server rule and the screen that shows its refusal. | Each unit states exactly its own part of that example, so the two parts together cover it. Neither unit says only "server side" or "UI part". |
| SW-P9 Bounded unit | Shape a broad spec with many settled decisions and a detailed architecture document into one unit that spans a large part of it. | The unit stays near 4,000 characters, carries only the decisions a worker could otherwise get wrong and at most three risks, and does not retell the spec or architecture. If it cannot fit, the output says the unit is too broad and splits it for a concrete reason. |
| SW-P12 Target shape | Shape a unit that adds a third payment provider to code where two providers are handled by duplicated branches in the checkout service. | The unit's Target shape names the structure the code should have with three providers, as if that had been required from the start, and lists what the unit removes: the duplicated branches, their callers' special cases, and tests that protect only those branches. It names structure, not implementation steps. |
| SW-N5 One-line unit | Shape a mission that reduces to a single one-line configuration change. | One unit with one-line fields; it does not pad the contract, add implementation steps, or write code. |
| SW-N6 Design already fits | Shape a unit that adds one column to an export whose columns are declared in one table. | Target shape is `extend as is` with the reason in a clause. The unit invents no reshape and lists no removals. |
| SW-N4 Routine evidence | The requested label and observable behavior are explicit and all affected contracts are known. | No prototype is required; do not invoke planning for a routine implementation. |
