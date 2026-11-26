---
title: Implementation issues
description: The delivery units shape-work writes as tracker issues or into an initiative's plan.md, and the developer-owned execution choice.
---

# Implementation issues

> This page orients. The canonical contract agents load is
> [`plugins/agent-os-dev/skills/shape-work/references/implementation-issues.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/shape-work/references/implementation-issues.md).

Research, grilling, and prototypes provide decision evidence. The durable output of shaping is one
or more implementation-ready units. For work without an intent they are tracker issues and nothing
else: each issue opens with why the work is needed and holds the whole contract, and no intent,
spec, or plan file is written. Invoking shape-work allows it to create those new issues; other
tracker writes need the project policy's `## Tracker mandate`, and with no writable tracker the issue
texts come back in the reply. An initiative, work that has an intent, keeps its units in
`intents/<id>/plan.md` beside the spec (`source: files`), with one `### <KEY>` section per unit holding
its contract, or as tracker issues whose keys `plan.md` lists when the project policy makes the
tracker the source of truth (`source: issues`). The line format, claims, and status rules are in
[Intent, spec, and plan files](/reference/intents).

Shape-work is not complete, and a selected branch is not delivery-ready, until those issues exist.
Parked and rejected branches need no implementation issue.

## Required issue contract

Every unit is a self-contained work order. When there is a spec, the unit cites it for its source and writes out what it
is accountable for, so someone holding only the unit and the repository can start without guessing.
Every issue has a stable `(origin, unit key)` identity and records:

- ready or blocked state, read from dependencies, pull requests, and an explicit `blocked:` note rather
  than a status field written during delivery;
- one coherent independently useful or assessable delivery unit;
- boundaries and non-goals;
- the change surface: the modules, interfaces, and existing code the unit changes;
- the target shape: how that code should be organized once the unit is delivered, decided as if the
  requirement had been there from the start, and what the unit removes on the way, or `extend as is`
  with the reason when the existing design already fits;
- acceptance written out as concrete checks, each citing its spec example, with a shared example
  stating exactly this unit's part;
- ground truth that can verify the outcome and names where the acceptance is proven, such as one
  table-driven test, an end-to-end step, or an observation, since acceptance lines define behavior
  rather than the number of tests;
- dependencies, their current state, and what this unit consumes from each;
- only the settled decisions a worker could otherwise get wrong, with links;
- the requested delivery target;
- at most three open risks, without unresolved product choices.

Do not split a unit merely because its parts could use separate commits, sessions, files, or
technical layers. Split for an independently useful or assessable result, different ownership, a
separate migration, a delivery boundary, or a material risk and verification boundary. Keep schema,
API, UI, configuration, errors, and verification with the behavior they support.

## Epic contract

When one shared end result needs an owner, the epic records the shared outcome and acceptance, its
children or delivery units and their reasons, aggregate verification, and the explicit owner of
final verification. A child does not authorize siblings or close the parent; green children are not
aggregate verification. `deliver-work` performs the whole-result check when the request covers the
epic, and `batch-work` reuses the same contract for explicit integrated execution.

Retries search before creating and update existing issues. Dependencies determine the ready or
blocked frontier; they do not determine the execution workflow.

## The developer chooses execution

Any ready issue can be delivered individually with `deliver-work`, including one issue from a larger
sequential graph. `batch-work` consumes an existing dependency-mapped issue set only when the
developer explicitly requests integrated parallel execution. Several issues never imply batch-work
by themselves.

Creating issues is a planning write. It does not authorize product code changes, batch execution,
merge, deployment, or other delivery effects.
