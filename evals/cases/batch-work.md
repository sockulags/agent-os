# batch-work behavior and trigger cases

Run positive cases with `batch-work` explicitly invoked in a fresh session.

| Case | Scenario | Expected |
|---|---|---|
| BW-P1 Plan only | The developer asks to plan four decision-ready units with explicit dependencies. | One manifest records stable task definitions, hashes, frontier, concurrency, and aggregate checks. No worker starts because the request is planning-only. |
| BW-P2 Parallel frontier | The developer asks to execute; A and B are independent and C depends on both. | A and B receive isolated workspaces and current task definitions; C waits until both integrate. No second approval checkpoint appears. |
| BW-P3 Resume | A is integrated, B succeeded, and C waits on B. | Live state is reconciled; B integrates once, its checks rerun, and C becomes ready without duplicate dispatch. |
| BW-P4 Definition drift | A worker returns after its outcome or scope changed in the manifest. | The result is not integrated; the affected task is replanned or retried from the current definition. |
| BW-P5 Bounded retry | Attempt 1 fails and policy allows one retry. | The same task key receives attempt 2 in a fresh context. |
| BW-P6 Aggregate failure | Worker checks pass but the integrated end-to-end check fails. | The batch remains blocked at verification and is not called ready or delivered. |
| BW-P7 No worker mechanism | The host exposes no native worker or thread mechanism. | The coordinator emits current task handoffs and reports that they were not launched. |
| BW-P8 Delivery boundary | Aggregate verification passes and the request asks for one PR but not merge. | One PR is created or updated; merge and cleanup are not inferred. |
| BW-P9 Aggregate review | Several task results integrate and all aggregate checks pass. | The coordinator treats the complete batch as material, runs independent review on the integrated candidate, resolves supported findings, reruns affected aggregate checks, and only then delivers. |
| BW-P10 Existing issue graph | The developer explicitly invokes batch-work for four implementation-ready issues with dependencies. | The batch consumes the existing issue graph, preserves issue identity and dependencies, and creates execution state without redefining the product shape. |
| BW-N1 One unit | One decision-ready unit is supplied. | Route to `deliver-work`; do not create a batch manifest. |
| BW-N2 Open decision | A bounded unit still has a product decision. | Route it to `shape-work`; do not dispatch implementation. |
| BW-N3 Coupled decisions | Several inputs contain coupled unresolved choices. | Route to `chart-work`; implementation does not begin. |
| BW-N4 Implicit batch request | “Plan and parallelize this backlog” without explicit skill invocation. | The manual skill stays dormant. |
| BW-N5 Multiple issues only | Shape-work creates several implementation-ready issues, but the developer has not requested batch execution. | Batch-work stays dormant; the issues remain available for the developer to choose individually or as a later explicit batch. |

Pass criteria: task identity and dependency checks prevent stale or duplicate integration; workers
stay isolated; the coordinator owns integration; aggregate verification gates delivery; the request
governs planning, execution, PR, merge, deployment, and cleanup boundaries.
