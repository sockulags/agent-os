---
title: Maps and decision tickets
description: How plan-work uses a repairable map, canonical decisions, evidence, claims, reconsideration, and stable handoffs.
---

# Maps and decision tickets

> This page orients. The canonical contract agents load is
> [`skills/plan-work/references/map.md`](https://github.com/sockulags/agent-os/blob/main/skills/plan-work/references/map.md).

The map gives low-resolution orientation; each ticket owns its question, evidence, and decision.
Plan-work uses this depth only when independent ownership, separate evidence work, or parallel
treatment makes it worthwhile.

## Map

A useful map contains the outcome, boundaries, decisions, open frontier, Fog, reconsiderations,
shaping handoffs, delivery-ready branches, and spawned work. It links to canonical tickets instead
of repeating their evidence. A plain-language summary is optional and supports an actual decision;
it is not a general approval gate.

## Tickets

Each ticket states one question, why it matters, evidence needed, and dependencies. Evidence paths
are:

- repository research or measurements;
- a prototype;
- a developer product decision;
- a prerequisite task.

Open, unblocked, unclaimed tickets form the frontier. Claim before independent work, re-read live
state before writing, and protect concurrent updates with the planning surface's compare-and-swap or
equivalent. Independent tickets may be worked in parallel only when workers are explicitly provided;
the map never starts them automatically.

A resolved ticket records decision, evidence, rejected alternatives, consequence, new work, and open
risks. A reconsideration preserves the prior resolution, names the decision under review, why it is
being revisited, and the open question; it ends as confirmed or replaced only after a new decision.
Developer preferences must come from the developer.

## From decisions to delivery readiness

When a branch becomes bounded enough for one `shape-work` session, create or reuse one handoff with
stable identity `(origin map, branch key)`. Link settled decisions, evidence, prototypes, and
remaining questions. Search before creating so retries stay idempotent. This marks the branch as
shaping, not delivery-ready.

Shape-work later creates or reuses the implementation issues and reconciles their links and ready or
blocked frontier into the map. Only then does the branch become delivery-ready. A selected branch
that has only a shaping handoff keeps the map open.

Planning writes are authorized only by the request and project policy. Product implementation and
external tracker writes require their own covered mandate. A ready issue is not authorization.
