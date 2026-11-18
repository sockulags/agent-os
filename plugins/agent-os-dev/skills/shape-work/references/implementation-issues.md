# Implementation issues

Shaping writes delivery units where the next person and agent will find them. Research, grilling,
and prototypes are decision evidence; the durable output of shaping is the unit set that a developer
can choose to run with `deliver-work` or `batch-work`.

## Where units live

Choose from the size of the work. Never create an intent, spec, or plan file only to give units a
place to live.

- **Issues only (the default).** Work without an intent: a feature, change, or fix that one or a few
  pull requests deliver. Each unit is an issue in the project's tracker, and the issue is the whole
  record. No `intent.md`, `spec.md`, or `plan.md` is written. Origin is the request or the issue the
  work came from, dependencies are the tracker's issue links or a `Depends on` line, and an epic
  contract goes in a parent issue.
- **Intent plan.** Work that already has an intent, which is an initiative. `intents/<id>/plan.md`
  beside the spec lists every unit. With `source: files` it holds each unit's contract; with
  `source: issues`, set when the project policy makes a tracker the source of truth for units, it
  lists the tracker keys and the issues hold the contracts. The plan contains links, never copies.

The tracker is the one the project policy names, otherwise the repository host's issue tracker when
the session can write to it, such as GitHub Issues. Invoking `shape-work` authorizes creating new
issues there, and updating the issues it created for the same origin when shaping is retried. Any
other tracker write, such as editing, commenting on, relabeling, or closing other issues, still
needs the project policy's `## Tracker mandate`. When no tracker can be written, return each
issue's text in the reply for the person to create, and write no file.

When a plan-work run supplied a plain-language summary for an actual decision, it is the spec's
`## Summary`, or on the issues-only path the opening of the first issue. Do not turn summary
approval into a second gate or copy the plan into a competing specification.

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

Outcome:
Boundaries:
Change surface:
Acceptance:
Ground truth:
Dependencies:
Evidence and settled decisions:
Delivery target:
Open risks:
```

What each field must hold is the unit contract in `SKILL.md`. A field value may run over several
lines, and Acceptance is usually a list.

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

## Issues

A tracker issue carries the same fields as headings, on both paths. On the issues-only path it also
opens with the need in one or two sentences, because no intent holds it, and it is claimed by a
draft pull request that links it with the tracker's closing reference, such as `Closes #12` on
GitHub. It is delivered when that pull request merges.

```text
## Implementation issue
Origin: <intent id and plan link, or the request or issue the work came from>
Unit key: <stable key>
Status: ready | blocked

## Why (issues-only path)
## Outcome
## Boundaries
## Change surface
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

When one shared end result needs an owner, add an epic contract to the plan, or to a parent issue
on the issues-only path, instead of splitting every technical layer into a child:

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
