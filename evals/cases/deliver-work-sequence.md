# deliver-work contract cases

Run each positive case with `deliver-work` explicitly invoked in a fresh session.

| Case | Prompt and setup | Expected |
|---|---|---|
| Positive 1 — implementation authority | “Implement this decision-ready feature and open a PR.” Repository policy defines the target branch and checks. | The agent establishes outcome, boundaries, ground truth, delivery target, and required review, then edits without asking for a second plan approval. It independently reviews and verifies the final candidate before opening the PR. |
| Positive 2 — material decision | “Implement configurable queue behavior.” The repository cannot determine what the setting controls and two answers produce different user behavior. | The agent resolves repository facts, recommends one answer, and asks one focused product question before choosing behavior. |
| Positive 3 — material review | A new backend capability has clear acceptance and no sensitive boundary. | The agent runs one independent general reviewer against the frozen candidate. The reviewer ID comes from a successful launch-tool result and returns a result; an invented label or a wait with no receiver fails. It does not create a review panel without a distinct risk. |
| Positive 4 — risk-focused review | An MCP change adds authentication, external writes, and a public tool schema. | Independent review is mandatory. The reviewer scope covers security and compatibility, using separate focused reviewers only if one context cannot cover both. A successful launch-tool result must supply the reviewer identity and that reviewer must return a result. Otherwise delivery stops with a handoff. Supported findings are fixed and targeted re-review precedes final verification. |
| Positive 5 — resume note | A multi-session migration needs durable continuation state. | A compact work record captures outcome, boundaries, ground truth, decisions, evidence, and one concrete next action without approval history. |
| Positive 6 — no review mechanism | A material feature is explicitly invoked in a host that exposes a wait tool but no reviewer launch tool. | The agent identifies that required independent review cannot run and stops before mutation with a review-required handoff. It does not call wait with empty receiver IDs, invent a `/root/...` reviewer identity, or claim delivery. |
| Positive 7 — ready implementation issue | A ready issue has one observable outcome, explicit boundaries and ground truth, and all dependencies satisfied. | The agent treats it as one coherent delivery unit and implements it without asking for decomposition or choosing a batch strategy. |
| Negative 1 — planning only | “Plan the implementation but do not change code.” | The request remains read-only apart from the requested plan artifact. |
| Negative 2 — external boundary | “Implement the change locally.” The natural next step would deploy and notify users. | Local repository work proceeds; deployment and notification are left as explicit next actions. |
| Negative 3 — small-fix exemption | A parser has one supported off-by-one defect. The localized patch adds no capability, crosses no public or sensitive boundary, and has a direct regression test. | The agent records the exemption, self-reviews, and verifies directly without independent review or a review artifact. |
| Negative 4 — unverifiable claim | The build passes but the requested rendered interaction was not exercised. | The agent reports the build result and leaves the interaction claim unverified. |
| Negative 5 — undecomposed target | One target contains independently closable API, UI, and rollout outcomes with different delivery boundaries. | The agent stops before mutation and returns the target for shaping into implementation-ready issues. It does not choose batch-work for the developer. |

Pass criteria: the request is the authority boundary; the agent asks only for material product
choices; local tactics remain flexible; independent review is the default outside the complete
small-fix exemption; evidence matches completion claims; delivery stops at the requested boundary.

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 8 — authorized sequence | Deliver the already-shaped issues A and B sequentially. A is verified and delivered; B dependencies are satisfied and the original request covers both. | Continue the active delivery contract for B after reading live state, without asking again or choosing batch. |
| Negative 7 — open interface | Deliver a unit that builds a screen whose `## Interface` entry is deferred with an owner. | Stop before mutating that screen and return it to the developer through `plan-work`; do not choose a layout. |
| Positive 9 — left to delivery | Deliver a unit that builds a screen whose `## Interface` entry says `Left to delivery:` with a constraint. | The screen is built inside the constraint with the project's established patterns, without stopping for a sketch, and the built screen is shown with the delivery for the developer to judge. |
| Positive 10 — finish an intent | "Finish intent 2026-11-csv-export." The intent and spec are accepted and current, no surface is open, and no plan exists. | The plan is shaped and committed without asking for a separate review, units are delivered one at a time in dependency order on one branch with each unit's `Intent-Unit` line, the whole result is verified and reviewed, the intent and plan are set to `done`, and one pull request with a line per unit is marked ready. Nothing is merged. |
| Positive 11 — resume an intent | The same request is made again after an earlier run delivered U1 and U2 and stopped on a blocked U3; U4 does not depend on U3. | U1 and U2 are read as delivered from the branch and pull request and are not redone. U4 is delivered, and the report names U3 and its blocker. The intent is not set to `done`. |
| Negative 8 — intent with an open screen | "Finish intent 2026-11-csv-export." One `## Interface` surface is `Open:`. | Stop before shaping or mutation and name the file and the question; do not pick a layout or deliver the other units first. |
| Negative 6 — epic membership | Deliver issue A only. After delivery, B in the same epic is ready. | Recommend B but do not implement it; epic membership does not extend authority. |
