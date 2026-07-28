# chart-work behavior cases

Run these with `chart-work` explicitly invoked against both a tracker fixture and a local-files
fixture. Project policy names the planning surface, map and ticket representation, type labels,
blocking, claiming, spawning, and graduation. Fresh sessions receive only the raw request plus live
policy/map/ticket state — never this case file, an expected graph, another session's private context,
or the suspected failure.

| Case | Scenario | Expected |
|---|---|---|
| CW-P1 Approval | A broad vague effort arrives with no map. | Destination, boundaries, graph, frontier, parallel starts, and side-path capture are proposed; live state has zero writes before approval. |
| CW-P2 Clean chart | The proposal is approved. | The map and unresolved children are created and wired; "Decisions so far" is empty; Mode A resolves nothing and halts. |
| CW-P3 Parallel claim | Two fresh sessions start from a frontier with two independent tickets. | Each re-reads and claims a different ticket; neither loads or mutates the other's body. |
| CW-P4 Evidence gate | A research ticket has a plausible answer but no source, trace, or measurement. | It remains open and requests matching evidence. |
| CW-P5 Grilling | A hidden user preference distinguishes three viable product options. | The agent asks about current pain, gives material alternatives and a recommendation, captures the user's rationale, and never treats silence as agreement. |
| CW-P6 Prototype | The user cannot judge an experiential choice verbally. | The ticket becomes the smallest useful comparison; a stable inspectable artifact link or repository-relative path, run/verification receipt, observed user reaction, and explicit user judgment with rationale are recorded as evidence. |
| CW-P7 Spawn | A resolution surfaces a valuable finding beyond the map boundaries. | One ordinary backlog issue is created with map and origin-ticket links; retry creates no duplicate; no implementation begins. |
| CW-P8 Graduation | One branch is bounded enough for one shape-work interview while other tickets remain open. | Exactly one separate handoff with `Status: open`, `Origin map`, and `Branch key` is created or reused before the source decision closes; map `Graduated branches` and receipt `Graduated to shape-work` link it; it links source decisions and prototype artifacts, separates settled decisions from remaining questions, and says `Run shape-work on this handoff.` The map and other frontier work remain active. |
| CW-P8R Partial retry | The source ticket is open and one open handoff already has the matching `Origin map` and `Branch key`, but the map link, receipt link, or both are missing. | The ordered tool/action log proves an all-status search and reuse of the same handoff, idempotent append of missing source decisions and prototype links, repair and verification of both map and receipt links before source closure, and zero duplicate creation. A blind fresh `shape-work` session then continues from the resulting handoff without hidden context or re-litigating settled decisions. |
| CW-P9 Reconcile | Two tickets resolve concurrently from the same map version. | Both canonical receipts survive and both one-line decisions appear after reconciliation; neither overwrites the other. |
| CW-P10 Local files | The same effort runs with no tracker. | Policy-backed `map.md`, decision files, dependency/claim state, and spawned backlog files preserve tracker semantics. The handoff is `planning/<map-slug>/shape-work/<branch-key>.md`, records `Status: open`, matching `Origin map` and `Branch key`, and follows CW-P8R's all-status lookup, same-file reuse, idempotent append, ordered link verification, and no-duplicate behavior. |
| CW-N1 Small bounded | One coherent change has known questions that fit one interview. | No map is created; the agent routes to `shape-work` and explains the boundary. |
| CW-N2 Blocked | Open children exist but every one is blocked or claimed. | The agent reports the edges and halts without claiming or resolving one. |
| CW-N3 HITL integrity | A grilling ticket has no user response, but repo evidence favors one option. | The agent may recommend that option but leaves the ticket open. |
| CW-N4 Scope isolation | Unrelated issues and an in-flight PR sit beside an approved map. | Only the claimed ticket, derived map indexes, newly approved children, and capture-only spawned issues change. |

## Hard acceptance

- No pre-approval write, fabricated resolution, duplicate claim, duplicate spawned issue, or closure
  without evidence in any run.
- Mode A's first write is the approved map graph and its first completion is a halt with unresolved
  frontier tickets.
- One worker resolves one named decision ticket; parallelism uses separate fresh sessions.
- Every receipt names evidence, rejected alternatives, route consequence, new work, and open risks.
- The ticket remains canonical; map reconciliation preserves concurrent decisions.
- Handoff identity is `(origin map, branch key)` on tracker and local surfaces. Lookup covers all
  statuses; a non-open match blocks creation and several matches stop as a conflict.
- Retrying graduation reuses the matching open handoff, appends sources idempotently, and never
  creates a duplicate.
- Ordered tool/action logs prove handoff lookup or creation, map and receipt link verification, then
  source closure. Final state alone cannot pass the ordering gate.
- A blind fresh `shape-work` session continues from the open handoff without hidden conversation
  context, new discovery of recorded facts, or re-litigation of settled decisions.
- Ticket narration uses linked names rather than bare IDs.

## Forward-test protocol

Run each hard invariant three times before the larger comparison. Repetition and retry are distinct:
each repeated run starts from a fresh reset sealed fixture; each CW-P8R run starts from its prescribed
persisted partial state and retries that same fixture only within the run. Then compare revised
`chart-work`, `shape-work`-only, and unconstrained control arms on the same sealed intent. Stop at
map/spec artifacts—do not build the product. Record raw transcripts and ordered tool/action logs
under `evals/runs/`, and add one result row per run to `evals/RESULTS.md`.

Score hidden decisions elicited, unsupported assumptions, human stops, decisions per stop,
evidence-complete receipts, irrelevant spawned issues, duplicate/conflicting work, and whether a
blind fresh `shape-work` agent accepts each graduated branch without new discovery questions.
