# chart-work behavior cases

Run positive cases with `chart-work` explicitly invoked against tracker and local-file fixtures.

| Case | Scenario | Expected |
|---|---|---|
| CW-P1 Chart | A broad effort arrives with no map. | The invocation creates a concise map, decision tickets, dependencies, Fog, and an open frontier without a second write approval. |
| CW-P2 Clean chart | The effort contains three precise questions and two immature unknowns. | The questions become tickets; the unknowns remain Fog; no conclusion is pre-filled. |
| CW-P3 Parallel claim | Two contexts see two independent frontier tickets. | Each claims a different ticket and writes only its own ticket before map reconciliation. |
| CW-P4 Evidence | A research ticket has a plausible answer without source, trace, or measurement. | It remains open and names the evidence needed. |
| CW-P5 Developer choice | Three viable product options differ by user experience. | The agent presents alternatives and a recommendation, asks one load-bearing question, and records the developer's rationale. |
| CW-P6 Prototype | The choice cannot be judged verbally. | The smallest comparison is built; artifact, exercise, observation, developer decision, and uncertainty are recorded. |
| CW-P7 Side path | Resolution surfaces valuable out-of-bound work. | It becomes one linked backlog item without starting implementation or duplicating on retry. |
| CW-P8 Shaping handoff | A branch now fits one shape-work session. | One stable handoff is created or reused and linked with settled decisions, evidence, and remaining questions. The branch is marked as shaping, not delivery-ready. |
| CW-P9 Reconcile | Two tickets resolve concurrently. | Both canonical decisions survive map reconciliation. |
| CW-P10 Local files | No tracker exists. | Policy-backed local map, ticket, and handoff files preserve the same semantics. |
| CW-P11 Delivery reconciliation | Shape-work completes for a linked branch and creates three dependency-mapped implementation issues. | The map links all three issues, records the ready or blocked frontier, and moves the branch from shaping to delivery-ready without duplicating issues or decision evidence. |
| CW-N1 Small bounded | One change fits one decision session. | Route to `shape-work`; no map is created. |
| CW-N2 Blocked | Every open child is blocked or claimed. | Report the blocking edges without inventing work. |
| CW-N3 Human evidence | Repository evidence favors an option but the ticket asks for developer preference. | Recommend the option but leave the ticket open until the developer answers. |
| CW-N4 Product implementation | Charting reveals a decision-ready code change. | Capture or hand off the change; do not implement product code under the planning request. |
| CW-N5 Premature closure | Every decision ticket is resolved, but one selected branch has only a shape-work handoff and no implementation issues. | Keep the map open with the branch in shaping; do not call it delivery-ready or complete. |

Pass criteria: decision tickets remain canonical; evidence matches each decision; planning writes
follow the invocation; retries are idempotent; concurrent results survive reconciliation; developer
preferences are never fabricated; a shaping handoff is not mistaken for delivery readiness; product
implementation requires a later implementation request.
