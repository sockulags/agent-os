---
title: shape-work
description: Turn a bounded mission into coherent delivery units, dependencies, and implementation-ready issues.
skill-description: Shapes a request, bounded mission, or accepted spec into coherent delivery units with dependencies, written as implementation-ready tracker issues, or as plan.md beside an initiative's spec, backed by settled product decisions. User-invoked when delivery structure or an epic contract still needs shaping. Not for work whose delivery unit is already shaped; a known fix that needs an issue gets one without an interview.
summary: Shape work into delivery units as tracker issues, or plan.md for an initiative
---

# shape-work

**Bucket:** workflow · **Invocation:** manual · `/shape-work` (direct Claude), `/agent-os-dev:shape-work` (Claude plugin), or `$shape-work` (Codex)

Shapes a request, a bounded mission, or a spec into coherent delivery units and implementation-ready
issues backed by settled product decisions.

Most work needs nothing but the issues. When the work has no intent, shape-work writes its units
straight into the project's tracker and nothing else: no `intent.md`, `spec.md`, or `plan.md`. Each
issue opens with why the work is needed and holds the whole contract. Only an initiative, work that
already has an intent and spec, also gets a `plan.md`. Invoking shape-work allows it to create the
new issues it shapes; changing anything else in the tracker needs the project policy's
`## Tracker mandate`. When no tracker can be written, it returns the issue texts in the reply.

```mermaid
flowchart TD
    A[Request, bounded mission, or spec] --> B[Read repo, policy, linked plan decisions]
    B --> C{Material product choice left?}
    C -->|recommend + one question| D[Developer decides]
    D --> C
    C -->|all settled| E[Product shape: outcome, boundaries,<br>acceptance, ground truth]
    E --> F[Create or reuse implementation issues]
    F --> G[Ready frontier exposed]
    G -.->|developer selects one issue| H([deliver-work starts])
    G -.->|developer explicitly requests a batch| I([batch-work starts])
```

Read the repository, policy, and linked decisions before asking questions. Resolve discoverable
facts yourself. Ask only about product choices that materially change the outcome, always with a
recommendation and its consequence.

Without a spec, an open screen layout or flow is a product question that shape-work asks while
shaping, recommending [`design-work`](/skills/design-work) when sketching would help, and the answer
goes into the unit. With a spec, shape-work does not settle the interface; the spec's
`## Interface` section does. Units that build
those screens link it. When the section leaves a decision open, is missing for work that changes
what a person sees, or a unit would change a screen it does not cover, shape-work returns that
question to [`plan-work`](/skills/plan-work), where the developer decides it, sketches it with
[`design-work`](/skills/design-work), or leaves it to delivery, and keeps the affected units blocked
until it is settled. A surface left to delivery blocks nothing. Use a diagram when it makes dependencies or boundaries easier to judge.

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. Start from one coherent delivery unit and split
only for an independent result, ownership, migration, delivery, or material risk and verification
boundary. Separate commits, sessions, files, or technical layers are not enough. Keep schema, API,
UI, configuration, errors, and verification with the behavior they support. Then write the units:
tracker issues for work without an intent, and for an initiative `intents/<id>/plan.md` beside the
spec, or tracker issues listed by key in `plan.md` when the project policy makes the tracker the
source of truth (`source: issues`). Link real dependencies and report the first claimable frontier
to the developer; it is derived from the issues or the plan and is not written into them.

Each unit is a self-contained work order: someone holding only the unit and the repository knows
what to change, where, what done means, and how to prove it. When there is a spec, it stays the
authority. A unit
writes out what it is accountable for and cites its source, and when the two disagree the spec wins.
`built_on` marks restated text stale when the spec changes. Before publishing, shape-work reads each
unit as a worker who has only it and the repository, adds whatever that worker would have to guess,
and removes whatever would not change what they build or check. A unit is a work order, not a design
document. Its `Target shape` field is where the structure is decided before delivery: how the
touched code should be organized as if the requirement had been there from the start, and what the
unit removes on the way, such as the old path and its callers, tests that protect only the replaced
implementation, and comments that explain a workaround. An existing pattern does not decide it, and
`extend as is` with a reason is a valid answer. Because the removals are written into the unit,
[scope-guard](/skills/scope-guard) treats them as required work rather than drift. A one-line change gets one-line fields, a typical unit fits in about 4,000 characters, it
carries only the decisions a worker could otherwise get wrong and at most three risks, and it holds
no code or implementation steps.

For an initiative, `plan.md` lists each unit as `- [U1] title`, optionally followed by ` — depends on U1` and
` — blocked: reason`, and gives each unit a `### U1 title` section with its outcome, boundaries,
change surface, target shape, written-out acceptance, ground truth, what it consumes from each dependency, settled
decisions, delivery target, and open risks. Unit keys never change. Delivery status is never
written into the plan: a draft pull request with `Intent-Unit: <intent-id>/<unit-key>` claims a unit,
and its merge delivers it. An issue without an intent is claimed by a draft pull request that links
it, such as `Closes #12`. A spec built on an older intent revision is not shaped; it goes back to
plan-work. A plan built on an older spec revision is reshaped with stable keys. See
[Intent, spec, and plan files](/reference/intents).

One shape may produce one issue, several independent issues without an epic, or an epic with
children when one shared result needs an owner. Issue count does not select an execution workflow.
The developer may run any ready issue with `deliver-work`, or explicitly choose `batch-work` for
integrated parallel execution.

When shaping started from `plan-work`, reconcile issue links and readiness into the origin handoff
and map. A shaping handoff alone is not delivery-ready. Shape-work completes only when every selected
branch points to implementation-ready issues or is explicitly parked or rejected.

An epic contract records the shared outcome, acceptance, children or delivery units, aggregate
verification, and the owner of final verification. A child does not authorize siblings or close the
parent; green child checks are not aggregate verification. Deliver-work checks the whole result when
the request covers the epic, and batch-work reuses the same contract.

The invocation authorizes planning artifacts, not product code.

See [Implementation issues](/reference/implementation-issues).

## Transcript: one question, then issues

Condensed illustration of the recommend-then-ask pattern.

```text
User:
/shape-work Turn the report-export branch into ready issues.

Agent:
Settled from the tickets: CSV of the active filtered result, reuse
report-view permission, synchronous through 10,000 rows.

One product choice remains: what happens above the limit?
  a) hide the export action        — invisible, but users ask why it's gone
  b) disable it with an explanation — visible boundary, no silent failure
Recommendation: b. One sentence of UI copy, no new capability.

User:
b.

Agent:
Issues created on the planning surface:
  EXPORT-API  ready    serializer, endpoint, authorization tests
  EXPORT-UI   ready    download action, disabled state above limit
  EXPORT-E2E  blocked  depends on EXPORT-API + EXPORT-UI

Delivery frontier: EXPORT-API, EXPORT-UI. Execution is your choice —
deliver-work per issue, or batch-work if you ask for an integrated batch.
```

## Experiments and continuation

Use the [experiment decision](/reference/prototypes) for technical uncertainty that needs
observation; interface alternatives belong to design-work. Routine choices with sufficient evidence need no prototype. Recommend one
concrete next action with a reason, not only the ready frontier. When the original request also
covers the bounded implementation, continue into sequential delivery; planning alone stops with
the recommendation.
