---
title: The work loop
description: Choose the lowest agent-os workflow that matches the uncertainty, then verify the requested delivery target.
---

# The work loop

Enter at the lowest workflow that matches the uncertainty.

```mermaid
flowchart TD
    A[Broad effort] -->|chart-work| B[Decision tickets]
    B -->|bounded branch| C[shape-work contract]
    A2[Bounded open choices] -->|shape-work| C
    C -->|one ready unit| D[deliver-work]
    C -->|several ready units| E[batch-work]
    E -->|isolated workers| F[Integrated candidate]
    D --> G[Verified delivery target]
    F --> G
    H[dispatch-next] -.->|selects or dispatches one target| B
    H -.-> C
    H -.-> D
    H -.-> E
```

Use `chart-work` when several decision threads can move independently. Use `shape-work` for one
bounded set of product choices. Use `batch-work` for several decision-ready units with stable
dependencies. Use `deliver-work` for one ready change.

Each workflow inherits the same authority rule: the request governs what happens. Planning requests
produce planning artifacts. Execution requests may mutate repository files in scope. Delivery stops
at the requested or policy-defined boundary.

The automatic disciplines run underneath:

- `diagnose-before-fix` establishes a supported cause for unknown failures;
- `scope-guard` contains required, adjacent, and conflicting discoveries;
- `verify-before-done` matches material completion claims to fresh evidence.

Durable records are optional working memory. Use them when sessions or parallel work need recovery,
not to prove that ceremony occurred.

## Worked example: filtered CSV export

The request begins as fog:

> Add export to reports. It should be safe and work for large customers.

### 1. chart-work separates the decisions

`chart-work` creates a small map and three **decision tickets**. A decision ticket owns one question,
its evidence, and the resulting decision.

| Ticket | Question | Evidence | Decision |
|---|---|---|---|
| EXP-1 | What is exported? | Current filter model and support requests | CSV of the active filtered result |
| EXP-2 | Who may export? | Existing report authorization tests | Reuse report-view permission |
| EXP-3 | What counts as large? | Production row-count sample | Synchronous through 10,000 rows; larger exports are out of scope |

The artifact is `planning/report-export/map.md` plus the three tickets. The broad request is now one
bounded branch with settled product decisions.

### 2. shape-work makes the branch executable

`shape-work` follows those tickets and produces a decision-ready contract:

```text
Outcome: A permitted user downloads the active report filter as UTF-8 CSV.
Boundaries: No scheduled exports, background jobs, or new permission model.
Ground truth: API contract test + rendered download flow + unauthorized request test.
Delivery: One pull request; no merge or deployment.
```

**Ground truth** is the observation that can decide the claim. “The build passes” is not ground truth
for a browser download.

### 3. batch-work runs the ready units

The contract splits into two independent implementation tasks and one dependent integration task:

```text
EXPORT-API  -> serializer, endpoint, authorization tests
EXPORT-UI   -> download action, loading and error states
EXPORT-E2E  -> depends on EXPORT-API + EXPORT-UI
```

`batch-work` records stable task definitions, dependencies, hashes, worker commits, and aggregate
checks in `.agent-os/batches/report-export.md`. API and UI run in isolated workspaces. E2E waits.

### 4. deliver-work produces evidence

Each worker uses `deliver-work` against its task outcome, boundaries, and checks, then returns a
commit and evidence. The coordinator integrates API and UI once, releases E2E, and reruns the
aggregate download path on the integrated candidate.

The batch is **reconciled** when the current task definitions, returned commits, integrated files,
and dependency state agree. It is not delivered yet. Delivery follows only after the aggregate
ground truth passes:

```text
Command: npm test -- report-export
Exit: 0
Result: API, authorization, and CSV encoding cases pass.

Command: npm run test:e2e -- report-export
Exit: 0
Result: filtered CSV downloads; unauthorized export is rejected.
```

The final artifact is one verified pull request. Merge and deployment remain outside the request.
