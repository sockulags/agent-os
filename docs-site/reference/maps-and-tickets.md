# Maps and decision tickets

The artifacts [`chart-work`](/skills/chart-work) creates. Read this before creating a map, creating a
ticket, or closing one.

## Tracker wiring

The map lives on the planning surface named by the [project policy](/guide/project-policy). The policy
defines the map representation, the decision-ticket representation and its type labels, and the
conventions for blocking, claiming, spawned-issue links and branch graduation. When any of these is
undefined, ask once and propose the missing policy.

Where no tracker exists, use the policy's local planning folders. With no local convention, the
proposed layout is:

```text
planning/<map-slug>/map.md
planning/<map-slug>/decisions/<ticket-slug>.md
backlog/<spawned-issue-slug>.md
```

Everything below still applies: a decision file is a child ticket, and its resolution section is the
tracker resolution comment.

## The map

One map per effort. The ticket owns the decision; the map provides low-resolution orientation and
derived indexes that can be rebuilt from its children.

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

Keep one line per entry. A map that restates ticket evidence has become a competing source of truth.

## Ticket types

The type describes how evidence is produced. Every child remains a decision ticket.

| Type | Evidence sought | Resolved by |
|---|---|---|
| `research` | What is true of the codebase, ecosystem or constraints | A worker with inspectable sources or measurements |
| `prototype` | Which approach survives contact, or feels right | An agent-built comparison, verified and judged with the user |
| `grilling` | Which trade-off the product should choose | A live user decision, one load-bearing question at a time |
| `task` | What prerequisite must happen before a decision can be stated | An agent when authorized; otherwise a human checklist |

## Frontier and concurrency

The frontier is every open, unblocked, unclaimed child. Claim through the policy's convention before
working, and re-read immediately before claiming and before mutating. If the frontier is empty while
children remain open, report the blocking edges.

Parallel workers write their own tickets first, then reconcile the map index by re-reading live state
and merging entries. Spawned issues use stable origin links, and an existing issue with that origin is
checked for before creation, so retries do not duplicate work.

## Ticket shape

A ticket title states the question in recognizable words. Its open body contains:

```text
## Question
## Why it blocks or changes the route
## Evidence needed
## Dependencies
```

Do not pre-fill a conclusion. Alternatives and recommendations belong to the elicitation that resolves
the ticket, not to a body that pretends the choice is still open.

## Resolution receipt

Close with one receipt:

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

Route each consequence explicitly. A newly precise in-scope question becomes a decision child. A
valuable finding beyond the boundaries becomes an ordinary issue linked to its origin ticket and map,
and capturing it never starts implementation. A bounded branch whose remaining product decisions fit
one interview graduates to [`shape-work`](/skills/shape-work) while the rest of the map stays active.
A path not worth pursuing is parked or ruled out with the reason recorded.

A receipt without evidence or route consequence is a note, not a resolved decision.

## Elicitation by type

**Grilling** starts by asking what hurts, fails or feels wrong in the current experience, then presents
two or three materially different alternatives, recommends one and states its main consequence, and
asks the user to react one load-bearing decision at a time. Capture why the user chose, not only which
option. Silence, momentum, approval of the map or approval of a bundle is not an answer to an
individual ticket — and when the user cannot judge the difference in words, the ticket converts to
`prototype`.

**Prototype** builds the smallest disposable comparison that makes the contested behavior observable,
offers the alternatives side by side or behind one obvious toggle, verifies the artifact actually
runs, and asks the user to perform the shortest meaningful task. The prototype is evidence, not the
destination deliverable.

**Research** answers factual questions with primary sources, repository evidence or direct
measurements, recording source links, commands, relevant outputs and uncertainty. A plausible
explanation without an inspectable source or measurement does not close the ticket.

**Task** performs or hands off only the prerequisite action needed to make a later decision stateable,
and records what changed, the receipt that proves it, and the decision it unlocked.
