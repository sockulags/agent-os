# Decision map

The configured planning surface owns the map and its tickets. With no project convention, use:

```text
planning/<map-slug>/map.md
planning/<map-slug>/decisions/<ticket-slug>.md
planning/<map-slug>/shape-work/<branch-key>.md
```

## Map

Keep the map low-resolution and rebuildable from its tickets:

```text
## Destination
## Boundaries
## Decisions
- <ticket> → <decision gist> (<link>)
## Fog
## Shaping handoffs
- <branch> → <shape-work handoff> (<link>)
## Delivery-ready branches
- <branch> → <implementation issues and frontier> (<links>)
## Spawned work
```

The map orients. It does not duplicate ticket evidence.

## Decision tickets

Every ticket states one question, why it matters, the evidence needed, and its dependencies. Choose
the evidence path that fits:

- `research`: repository evidence, primary sources, or measurements;
- `prototype`: a comparison that makes the contested behavior observable;
- `grilling`: a product trade-off the developer must decide;
- `task`: a prerequisite needed before the decision can be stated.

An open, unblocked, unclaimed ticket is on the frontier. Claim before working and re-read live state
before writing. Independent frontier tickets may run in parallel; each worker writes its own ticket.

Resolve a ticket with:

```text
## Decision
## Evidence
## Rejected alternatives
## Consequence
## New work
## Open risks
```

Evidence must support the decision. Route new findings as child decisions, ordinary backlog work,
shaping handoffs, or parked paths.

## Shape-work handoff

When a branch's remaining product choices fit one bounded session, create or reuse a handoff.
Identity is `(origin map, branch key)`:

```text
## Shape-work handoff
Origin map: <link or id>
Branch key: <stable key>

## Outcome
## Boundaries
## Settled decisions
## Evidence and prototypes
## Questions left
```

Search before creating so retries reuse the same handoff. Link it from the map and relevant source
tickets. Update links idempotently and preserve concurrent entries. The handoff moves the branch to
shaping, not to `delivery-ready`. After shaping, `shape-work` creates or reuses the implementation
issues, records the ready or blocked frontier, and moves the branch to Delivery-ready branches. A
planning handoff or implementation issue does not authorize product implementation; a later
implementation request does.

A selected branch in shaping keeps the map open. Close it only when selected paths are
delivery-ready, parked, or ruled out and no Fog remains.
