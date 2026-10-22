# Implementation issues

Shaping writes delivery units where the next person and agent will find them. Research, grilling,
and prototypes are decision evidence; the durable output of shaping is the unit set that a developer
can choose to run with `deliver-work` or `batch-work`.

## Where units live

- **`source: files` (default).** `intents/<id>/plan.md` beside the spec lists every unit and holds
  each unit's contract.
- **`source: issues`.** When the project policy makes a tracker the source of truth for units,
  `plan.md` lists the units by tracker key and the tracker issues hold each unit's contract. The
  plan then contains links, never copies.

With no intent folder, write a minimal `intent.md` with the settled outcome first, following
`capture-intent`'s template, so the plan has a place and a revision to build on.

When a plan-work run supplied a plain-language summary for an actual decision, it is the spec's
`## Summary`. Do not turn summary approval into a second gate or copy the plan into a competing
specification.

## Completion invariant

A selected product branch is not `delivery-ready`, and shape-work is not complete, until one or
more implementation units have been written or reused. A parked or rejected branch needs no unit.

Each unit represents one coherent delivery unit: an independently useful or assessable result with
a reviewable change boundary and ground truth that can verify it. The unit may depend on earlier
units, but technical layers that support the same behavior stay together. Split only for a concrete
delivery, ownership, migration, risk, or verification boundary; separate commits, sessions, files,
or technical layers are not sufficient reasons.

## plan.md

```markdown
---
intent: <YYYY-MM>-<slug>
rev: 1
built_on: spec@1
status: accepted
source: files
---

# Plan: <the outcome in one line>

## Units

- [U1] <title>
- [U2] <title> — depends on U1
- [U3] <title> — depends on U1 — blocked: <the open decision>

### U1 <title>

Outcome: <the observable change>
Boundaries: <non-goals and the smallest change surface>
Acceptance: <the spec examples this unit satisfies, by heading or number>
Ground truth: <commands or observations>
Delivery target: <pull request, commit, or local change>
Open risks: <or none>
```

Rules:

- Identity is `(origin, unit key)`, where the origin is the intent id. Unit keys never change once
  written, so pull requests and history keep pointing at the right unit. Search the plan and the
  tracker before creating anything so retrying the same shape updates units instead of duplicating
  them.
- Each line under `## Units` is `- [<KEY>] <title>`, optionally followed by ` — depends on <KEY>,
  <KEY>` and ` — blocked: <reason>`. With `source: issues` the key is the tracker key and the
  `###` sections are omitted.
- `status` is `accepted`, `done`, or `superseded`. Delivery status is never written into the plan.
  A unit is claimed by a draft pull request whose body carries `Intent-Unit: <intent-id>/<unit-key>`,
  and it is delivered when that pull request merges.
- `built_on` names the spec revision. A plan built on an older spec revision is stale.

With `source: issues`, each tracker issue carries the same contract:

```text
## Implementation issue
Origin: <intent id and plan link>
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

Use dependencies to distinguish order from execution strategy. A unit is ready when its product
decisions are settled and its dependencies are delivered; otherwise record the exact blocker on its
line. The delivery frontier is the set of ready, unblocked units without an open pull request. Use
the tracker's existing status and label conventions rather than inventing a parallel queue
vocabulary.

## Epic contract

When one shared end result needs an owner, add an epic contract to the plan instead of splitting
every technical layer into a child:

```text
## Epic contract
Epic outcome: <shared observable result>
Acceptance: <aggregate acceptance examples, usually the spec's Behavior section>
Children or delivery units: <unit keys and why each boundary exists>
Aggregate verification: <checks for the complete result>
Final verification owner: <person or delivery role>
```

The contract belongs to shape-work and is consumed by delivery. A child issue contributes to the
epic but does not authorize its siblings, change its acceptance, or close the parent. Green child
checks are not aggregate verification. `deliver-work` owns the whole-result check when the request
covers the epic, and `batch-work` reuses this same contract for an explicitly selected batch.

## Routing belongs to the developer

Expose the frontier without choosing an execution workflow:

- `deliver-work` can deliver any one ready unit, including units from a larger sequential graph;
- `batch-work` consumes an existing dependency-mapped unit set only when the developer explicitly
  requests integrated parallel execution;
- the existence of several issues never invokes or recommends batch-work by itself.

Writing units is a planning write, not implementation authority. Do not edit product code, start a
batch, merge, deploy, or perform external delivery effects under a planning-only shape-work invocation.

## Plan-work reconciliation

When the origin is a plan-work handoff, update the handoff and map idempotently after materializing
the units. Link every unit, record the ready or blocked frontier, and move the
branch from shaping to `delivery-ready` only when the completion invariant holds. Preserve concurrent map entries and
keep decision tickets canonical for their evidence.
