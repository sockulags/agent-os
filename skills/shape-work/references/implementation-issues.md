# Implementation issues

The configured planning surface owns implementation issues. Research, grilling, and prototypes are
decision evidence; the durable output of shaping is the issue set that a developer can choose to
run with `deliver-work` or `batch-work`.

With no project convention, use:

```text
planning/<shape-slug>/implementation/<unit-key>.md
```

When the shape originates from `guide-me`, place the approved plain-language summary as a `## TLDR`
at the top of the shape's origin document, so the shape opens with what it solves before any
technical detail.

## Completion invariant

A selected product branch is not `delivery-ready`, and shape-work is not complete, until one or
more implementation issues have been created or reused. A parked or rejected branch needs no issue.

Each issue represents one coherent delivery unit: one observable outcome with a reviewable change
boundary and ground truth that can verify it. The unit may depend on earlier units, but it must not
contain an unresolved product decision or several separately closable delivery targets.

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

## Routing belongs to the developer

Expose the frontier without choosing an execution workflow:

- `deliver-work` can deliver any one ready issue, including issues from a larger sequential graph;
- `batch-work` consumes an existing dependency-mapped issue set only when the developer explicitly
  requests integrated parallel execution;
- the existence of several issues never invokes or recommends batch-work by itself.

Issue creation is a planning write, not implementation authority. Do not edit product code, start a
batch, merge, deploy, or perform external delivery effects under a shape-work invocation.

## Chart-work reconciliation

When the origin is a chart-work handoff, update the handoff and map idempotently after materializing
the issues. Link every implementation issue, record the ready or blocked frontier, and move the
branch from shaping to `delivery-ready` only when the completion invariant holds. Preserve
concurrent map entries and keep decision tickets canonical for their evidence.
