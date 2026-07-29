# Maps and decision tickets

The map gives low-resolution orientation; each ticket owns its question, evidence, and decision.

## Map

A useful map contains destination, boundaries, decisions, Fog, graduated branches, and spawned work.
It links to canonical tickets instead of repeating their evidence.

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

## Graduation

When a branch becomes bounded enough for one `shape-work` session, create or reuse one handoff with
stable identity `(origin map, branch key)`. Link settled decisions, evidence, prototypes, and
remaining questions. Search before creating so retries stay idempotent.

Planning writes are authorized by the charting request. Product implementation requires a later
implementation request.
