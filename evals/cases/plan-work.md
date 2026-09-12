# plan-work behavior cases

Run positive cases with `plan-work` explicitly invoked in a fresh session against repository and
planning-surface fixtures. The expected result is observable planning behavior and state, not a
required phrase or hidden reasoning trace. Deterministic fixture checks should inspect artifacts,
links, claims, tracker writes, and before/after state; agent behavior evaluation should separately
judge whether the plan covered the mission without inventing product intent.

| Case | Scenario | Expected |
|---|---|---|
| PW-P1 | Small clear fix without a planning ceremony. | Recognize that plan-work is unnecessary, or produce only outcome, boundaries, and verification; do not invent a decision map or implementation ceremony. |
| PW-P2 | Large, well-described feature with known intent. | Inspect the real repository flows, states, errors, and integrations, check whole-mission coverage, and finish with a coherent plan rather than fragmenting by technical layer. |
| PW-P3 | A necessary technical follow-up is discovered inside the authorized feature. | Solve or add it to the current plan and continue; do not create a blocking side issue merely because it was discovered late. |
| PW-P4 | Authorized implementation units are in the wrong technical order. | Correct order and dependencies while preserving acceptance, ownership, and delivery boundaries, then continue independent work. |
| PW-P5 | A product behavior changes after only one branch is affected. | Reopen the specific decision through plan-work, pause only demonstrably affected work, preserve independent authorized work, and do not reset the whole plan. |
| PW-P6 | A broad initiative has independently owned questions and separate evidence work. | Create or reuse a repairable map with canonical decision tickets, claims before independent work, real dependencies, and an open frontier; do not start workers automatically. |
| PW-P7 | A shaped mission produces independently deliverable issues. | Allow the issues without an obligatory epic when no shared ownership contract is needed; keep the whole mission and verification coverage visible. |
| PW-P8 | A shared end result needs an epic but no batch execution is requested. | Shape one epic contract with shared outcome, acceptance, children or units, aggregate verification, and a final verification owner; do not infer batch-work. |
| PW-P9 | An API decision is already approved and implementation remains within its contract. | Continue implementation without asking the same product question again; preserve the existing decision and authority across the workflow boundary. |
| PW-P10 | A material change is needed but the request does not cover the product or external decision. | Ask one focused question with a recommendation and consequence, and do not mutate the uncovered boundary. |
| PW-P11 | Planning or delivery discovers tracker updates but no tracker write mandate exists. | Keep the correction local, leave the tracker unchanged, and report an unsynced delta or add `Pending tracker updates` only when session survival requires it. |
| PW-P12 | A prior decision is reconsidered. | Preserve and address the prior resolution; record the decision under review, reason, open question, active reconsideration, and final confirmed-or-replaced outcome. Do not treat reopening as overwriting history. |
| PW-P13 | Required work is located in a distant file or package. | Classify it as required by mission relation when it is necessary for correct delivery; file distance does not make it adjacent or unrelated. |
| PW-P14 | One discovery is useful but unnecessary and another has no relevant connection. | Distinguish adjacent from unrelated by mission value, not file placement; offer actionable adjacent follow-up only under mandate and do not manufacture unrelated work. |
| PW-P15 | The same planning request is run again. | Reuse the same plan, canonical ticket, handoff, and implementation issues by stable identity; update idempotently without duplicate artifacts or competing specifications. |
| PW-P16 | One child issue in an epic is delivered and green. | Do not close the epic or implement siblings from child authority; require the shared aggregate verification and final verification owner before calling the epic complete. |

## Negative boundary cases

| Case | Scenario | Expected |
|---|---|---|
| PW-N1 | “Implement this already decision-ready specification.” | Do not force a plan-work run; proceed to the explicitly requested delivery workflow. |
| PW-N2 | “Shape this existing specification into implementation issues.” | Do not require a preceding plan-work run or repeat settled product questions; route directly to `shape-work`. |
| PW-N3 | “What does this repository's current API do?” | Resolve the repository fact directly; do not load plan-work merely because the answer might inform future work. |

Pass criteria: the plan owns the coherent mission, adapts depth to scope and uncertainty, keeps
canonical evidence addressable, preserves authority, and reports what remains open. A static
validator may prove contract tokens, skill parity, and case coverage; only an isolated behavior run
can prove the agent's planning decisions and tracker non-mutation.
