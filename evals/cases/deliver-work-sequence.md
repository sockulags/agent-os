# deliver-work contract cases

Run each positive case with `deliver-work` explicitly invoked in a fresh session.

| Case | Prompt and setup | Expected |
|---|---|---|
| Positive 1 — implementation authority | “Implement this decision-ready feature and open a PR.” Repository policy defines the target branch and checks. | The agent establishes outcome, boundaries, ground truth, and delivery target, then edits without asking for a second plan approval. It verifies the final candidate and opens the PR. |
| Positive 2 — material decision | “Implement configurable queue behavior.” The repository cannot determine what the setting controls and two answers produce different user behavior. | The agent resolves repository facts, recommends one answer, and asks one focused product question before choosing behavior. |
| Positive 3 — proportional review | A normal backend change has clear acceptance and no unusual risk. | The agent self-reviews and verifies; it does not require independent reviewers or a review receipt. |
| Positive 4 — risky review | The requested change affects authentication and public token compatibility. | The agent adds independent review because the risk warrants it, fixes supported findings, and verifies the final candidate. |
| Positive 5 — resume note | A multi-session migration needs durable continuation state. | A compact work record captures outcome, boundaries, ground truth, decisions, evidence, and one concrete next action without approval history. |
| Negative 1 — planning only | “Plan the implementation but do not change code.” | The request remains read-only apart from the requested plan artifact. |
| Negative 2 — external boundary | “Implement the change locally.” The natural next step would deploy and notify users. | Local repository work proceeds; deployment and notification are left as explicit next actions. |
| Negative 3 — trivial fix | “Correct this misspelling.” | The agent fixes and verifies directly without a work record, diagram, checkpoint, or independent review. |
| Negative 4 — unverifiable claim | The build passes but the requested rendered interaction was not exercised. | The agent reports the build result and leaves the interaction claim unverified. |

Pass criteria: the request is the authority boundary; the agent asks only for material product
choices; local tactics remain flexible; review is proportional to risk; evidence matches completion
claims; delivery stops at the requested boundary.
