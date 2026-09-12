# Implementation issues

The configured planning surface owns implementation issues. Research, grilling, and prototypes are
decision evidence; the durable output of shaping is the issue set that a developer can choose to
run with `deliver-work` or `batch-work`.

With no project convention, use:

```text
planning/<shape-slug>/implementation/<unit-key>.md
```

When a plan-work run supplied a plain-language summary for an actual decision, link it from the
shape's origin document. Do not turn summary approval into a second gate or copy the plan into a
competing specification.

## Completion invariant

A selected product branch is not `delivery-ready`, and shape-work is not complete, until one or
more implementation issues have been created or reused. A parked or rejected branch needs no issue.

Each issue represents one coherent delivery unit: an independently useful or assessable result with
a reviewable change boundary and ground truth that can verify it. The unit may depend on earlier
units, but technical layers that support the same behavior stay together. Split only for a concrete
delivery, ownership, migration, risk, or verification boundary; separate commits, sessions, files,
or technical layers are not sufficient reasons.

## Issue contract

Identity is `(origin, unit key)`. Search the configured planning surface before creating anything so
retrying the same shape updates existing issues instead of duplicating them.

```text
## Implementation issue
Origin: <shape-work handoff, planning artifact, or request link>
Unit key: <stable key>
Status: ready | blocked

## Outcome
## Boundaries
## Acceptance
## Ground truth
## Dependencies
## Evidence and settled decisions
## Delivery target
## Open risks
```

Use dependencies to distinguish order from execution strategy. An issue is `ready` when its product
decisions are settled and its dependencies are satisfied; otherwise record the exact blocker. The
delivery frontier is the set of ready, unblocked implementation issues. Use the planning surface's
existing status and label conventions rather than inventing a parallel queue vocabulary.

## Epic contract

When one shared end result needs an owner, shape an epic with this contract instead of splitting
every technical layer into a child:

```text
## Epic contract
Epic outcome: <shared observable result>
Acceptance: <aggregate acceptance examples>
Children or delivery units: <links and why each boundary exists>
Aggregate verification: <checks for the complete result>
Final verification owner: <person or delivery role>
```

The contract belongs to shape-work and is consumed by delivery. A child issue contributes to the
epic but does not authorize its siblings, change its acceptance, or close the parent. Green child
checks are not aggregate verification. `deliver-work` owns the whole-result check when the request
covers the epic, and `batch-work` reuses this same contract for an explicitly selected batch.

## Routing belongs to the developer

Expose the frontier without choosing an execution workflow:

- `deliver-work` can deliver any one ready issue, including issues from a larger sequential graph;
- `batch-work` consumes an existing dependency-mapped issue set only when the developer explicitly
  requests integrated parallel execution;
- the existence of several issues never invokes or recommends batch-work by itself.

Issue creation is a planning write, not implementation authority. Do not edit product code, start a
batch, merge, deploy, or perform external delivery effects under a planning-only shape-work invocation.

## Plan-work reconciliation

When the origin is a plan-work handoff, update the handoff and map idempotently after materializing
the issues. Link every implementation issue, record the ready or blocked frontier, and move the
branch from shaping to `delivery-ready` only when the completion invariant holds. Preserve
concurrent map entries and keep decision tickets canonical for their evidence.
