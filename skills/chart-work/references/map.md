# The map and its tickets

Read this before creating a map, creating a ticket, or closing one.

## Tracker wiring

The map lives on the planning surface named by project policy. The policy defines the map
representation, decision-ticket representation and type labels, blocking, claiming, spawned-issue
links, and branch graduation. Ask once and propose the missing policy when any of these is undefined.

Where no tracker exists, use the policy's local planning folders. With no local convention, propose:

```text
planning/<map-slug>/map.md
planning/<map-slug>/decisions/<ticket-slug>.md
planning/<map-slug>/shape-work/<branch-key>.md
backlog/<spawned-issue-slug>.md
```

Everything below still applies: a decision file is a child ticket, and its resolution section is
the tracker resolution comment.

## Map issue

Use one map per effort. The ticket owns the decision; the map provides low-resolution orientation
and derived indexes that can be rebuilt from its children.

```text
## Destination
One sentence: what is true when this effort ends.

## Boundaries
What this map deliberately does not settle.

## Decisions so far
- <ticket name> → <decision gist> (<link>)

## Fog
Named unknowns not yet precise enough to be tickets.

## Graduated branches
- <bounded branch> → <shape-work target> (<link>)

## Spawned work
- <valuable side path> → <ordinary backlog issue> (<link>)
```

Keep one line per entry. A map that restates ticket evidence becomes a competing source of truth.

## Ticket types

The type describes how evidence is produced; every child remains a decision ticket.

| Type | Evidence sought | Resolved by |
|---|---|---|
| `research` | What is true of the codebase, ecosystem, or constraints. | An AFK worker with inspectable sources or measurements. |
| `prototype` | Which approach survives contact or feels right. | An agent-built comparison verified and judged with the user. |
| `grilling` | Which trade-off the product should choose. | A live user decision, one load-bearing question at a time. |
| `task` | What prerequisite must happen before a decision can be stated. | AFK when authorized; otherwise a human checklist. |

## Frontier and concurrency

The frontier is every open, unblocked, unclaimed child. Claim through the policy convention before
work. Re-read immediately before claim and before mutation. If the frontier is empty while children
remain open, report the blocking edges.

Parallel workers write their own tickets first. Reconcile the map index afterward by re-reading live
state and merging entries. Use stable origin links for spawned issues and check for an existing issue
with that origin before creation, so retries do not duplicate work.

## Ticket shape

A ticket title states the question in recognizable words. Its open body contains:

```text
## Question
## Why it blocks or changes the route
## Evidence needed
## Dependencies
```

Do not pre-fill a conclusion. Alternatives and recommendations belong to the elicitation that
resolves the ticket, not to a body that pretends the choice is still open.

## Resolution

Prepare one resolution receipt while the ticket remains open:

```text
## Decision
## Evidence
## Rejected alternatives
## Route consequence
## New work
- Decision tickets:
- Spawned issues:
- Graduated to shape-work:
## Open risks
```

Route each consequence explicitly:

- A newly precise in-scope question becomes a decision child.
- A valuable finding beyond the boundaries becomes an ordinary issue with links to its origin ticket
  and map. Capturing it never starts implementation.
- A bounded branch whose remaining product decisions fit one interview graduates to `shape-work`
  while the rest of the map stays active.
- A path not worth pursuing is parked or ruled out with the reason recorded.

A receipt without evidence or route consequence is a note, not a resolved decision.

## Shape-work handoff

A bounded branch creates exactly one separate open `shape-work` handoff before its canonical source
decision ticket closes. This handoff is the next work object; the closed decision ticket remains
canonical only for the decision it resolved.

Use the tracker representation named by policy. With the local fallback, create
`planning/<map-slug>/shape-work/<branch-key>.md`. Tracker and local-file handoffs use the same
canonical identity: `(origin map, branch key)`. A branch key is stable within its origin map. The
handoff contains:

```text
## Shape-work handoff
Status: open
Origin map: <stable map link/id>
Branch key: <stable branch slug/key>

## Goal
## Non-goals
## Map
## Source decisions
## Prototype artifacts
## Decisions already settled
## Questions left for shape-work
## Next action
Run shape-work on this handoff.
```

Link the map and canonical source decision receipts under `Map` and `Source decisions`. Link every
relevant stable prototype artifact under `Prototype artifacts`. Keep settled decisions out of the
remaining questions so a fresh session can continue without hidden conversation context or
re-litigating them.

Create or reuse the handoff in this order:

1. Derive `(origin map, branch key)` and search matching handoffs across all statuses.
2. If several match, stop before closure and report the conflict. If one match is not open, stop and
   report its state; never create another or silently reopen it. Reuse one open match, or create an
   open handoff only when no match exists.
3. Append missing source decisions and prototype-artifact links idempotently, then update settled
   decisions and remaining questions without duplicating existing entries.
4. Link the map's `Graduated branches` entry and the source receipt's
   `Graduated to shape-work` entry to that open handoff.
5. Re-read both links, record their verification in the action log, then close the source decision
   ticket.

This ordering makes handoff creation idempotent on retry. Map approval authorizes creating this
planning handoff, but shaping and implementation remain separate user-controlled actions.
