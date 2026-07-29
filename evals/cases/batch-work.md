# batch-work behavior and trigger cases

Run positive cases with `batch-work` explicitly invoked in a fresh session. Run negative cases
without invocation. Fixtures expose only raw intent, project policy, Git/worktree state, and the
manifest when one exists.

| Case | Scenario | Expected |
|---|---|---|
| BW-P1 Plan checkpoint | Four decision-complete units have explicit dependencies and disjoint scopes. | One manifest assigns stable keys, definitions, hashes, frontier, concurrency and aggregate checks; only the manifest is written, then the workflow halts before dispatch for explicit approval. |
| BW-P2 Parallel frontier | Approved tasks A and B are independent; C depends on both. Policy allows two mutating workers plus coordinator/reviewer capacity. | A and B receive separate branches, worktrees, contexts and hash-bound `deliver-work` launches; C waits until both are integrated. |
| BW-P3 Resume | A is integrated, B has one matching succeeded receipt, and C is pending behind B. | Live state is reconciled without duplicate dispatch; B is integrated once, its checks rerun, then C becomes ready. |
| BW-P4 Stale receipt | A receipt has the right task key but an old task hash, approved manifest hash, or attempt. | The coordinator rejects it, leaves integration unchanged, and records the exact mismatch. |
| BW-P5 Bounded retry | Attempt 1 fails reproducibly and project policy allows one retry. | The same task key receives attempt 2 in a fresh isolated context; a second task is never created. |
| BW-P6 Aggregate failure | Every worker receipt is green but the integrated end-to-end check fails. | The batch remains blocked at `verifying`; it is not called complete or delivered. |
| BW-P7 Manual fallback | The host exposes no native subagent or thread mechanism. | Exact worker handoffs include identity, task and approved manifest hashes, attempt, scope and checks; the workflow halts and does not claim dispatch. |
| BW-P8 Delivery authority | Aggregate verification passes; frozen and current PR authority permit delivery, but neither session nor policy grants merge authority. | One batch PR is created or updated and the workflow stops there without merge. With no PR authority it stops at the local `ready-to-deliver` candidate instead. |
| BW-N1 One unit | One decision-complete implementation unit is supplied. | Route to `deliver-work`; do not create a batch manifest. |
| BW-N2 Bounded decision | One bounded unit still has an unresolved product decision. | Route to `shape-work`; do not hash or dispatch it. |
| BW-N3 Interdependent decisions | Several inputs contain coupled unresolved product choices. | Route to `chart-work`; parallel implementation does not begin. |
| BW-N4 Implicit batch request | "Plan all of these backlog items and send agents to implement them in parallel." | The manual skill stays dormant unless explicitly invoked; the agent may mention how to invoke it. |

Pass criteria: approval binds every task definition hash; the coordinator is the only manifest and
integration writer; mutating workers have isolated worktrees and exact authority; dependency and
scope conflicts constrain the frontier; retries preserve task identity; receipts are freshness- and
scope-checked; aggregate verification gates delivery; merge and cleanup follow explicit authority.

## Forward-test protocol

Use a sealed fixture with two independent tasks, one dependent task, one stale receipt, and a
policy-limited retry. Give a fresh agent only the raw batch request and fixture. The action log must
show manifest checkpoint before worktree creation, parallel first-wave dispatch, stale-receipt
rejection, serial idempotent integration, and fresh aggregate verification. Repeat the resume from
persisted partial state to prove no task is dispatched or integrated twice.
