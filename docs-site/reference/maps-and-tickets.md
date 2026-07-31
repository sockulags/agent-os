---
title: Maps and decision tickets
description: How chart-work separates orientation, canonical decisions, evidence, and stable handoffs.
---

# Maps and decision tickets

The map gives low-resolution orientation; each ticket owns its question, evidence, and decision.

## Map

A useful map contains destination, boundaries, decisions, Fog, shaping handoffs, delivery-ready
branches, and spawned work. It links to canonical tickets instead of repeating their evidence.

## Tickets

Each ticket states one question, why it matters, evidence needed, and dependencies. Evidence paths
are:

- repository research or measurements;
- a prototype;
- a developer product decision;
- a prerequisite task.

Open, unblocked, unclaimed tickets form the frontier. Independent tickets can run in parallel, with
each worker writing its own canonical ticket before the map is reconciled.

A resolved ticket records decision, evidence, rejected alternatives, consequence, new work, and open
risks. Developer preferences must come from the developer.

## From decisions to delivery readiness

When a branch becomes bounded enough for one `shape-work` session, create or reuse one handoff with
stable identity `(origin map, branch key)`. Link settled decisions, evidence, prototypes, and
remaining questions. Search before creating so retries stay idempotent. This marks the branch as
shaping, not delivery-ready.

Shape-work later creates or reuses the implementation issues and reconciles their links and ready or
blocked frontier into the map. Only then does the branch become delivery-ready. A selected branch
that has only a shaping handoff keeps the map open.

Planning writes are authorized by the charting request. Product implementation requires a later
implementation request.
