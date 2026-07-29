# chart-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:chart-work` or `$chart-work`

Turns fog into decision artifacts that independent threads resolve in parallel. Use it when an effort
spans several decision threads or sessions, before shaping its individual branches. Do not use it for
one bounded change that fits a single [`shape-work`](/skills/shape-work) interview, or for work that
is already decision-ready.

The map is a low-resolution index. Each ticket owns its own evidence and its own decision. Details of
both live in [Maps and decision tickets](/reference/maps-and-tickets). Tickets that use or convert to
`prototype` also follow [Prototype evidence](/reference/prototypes); frontend prototypes additionally
require [Frontend mockups](/reference/mockups).

## Mode A — chart the graph

1. **Name the destination and boundaries.** State what reaching it means, and what the map
   deliberately excludes.
2. **Chart breadth-first.** Create decision tickets for the questions that can be stated precisely.
   Questions that cannot be stated precisely yet stay in Fog.
3. **Classify the evidence path.** Use `research`, `prototype`, `grilling` or `task`. The type says
   how evidence is obtained; every child remains a decision ticket.
4. **Present for approval** — destination, boundaries, tickets, blocking edges, frontier, parallel
   starts, and permission to capture valuable side paths as linked ordinary issues — then halt before
   writing.
5. **Create the approved graph.** Create the map and its open children, wire the dependencies, expose
   the frontier, resolve nothing, and halt with the named tickets that parallel work can start from.

## Mode B — resolve one decision ticket

1. **Orient at low resolution.** Read the map, the frontier and the named ticket. Other ticket bodies
   load only when the evidence requires them.
2. **Claim one frontier ticket.** Re-read immediately before claiming; if it is blocked or already
   claimed, select another. Refer to tickets by linked name, never by bare ID.
3. **Produce evidence by type.** One worker owns one ticket, and independent workers may resolve other
   frontier tickets concurrently.
4. **Route the consequences.** Prepare the decision, evidence, rejected alternatives, route
   consequence, new work and open risks while the source ticket remains open.
5. **Create or reuse the graduation handoff.** For a graduating branch, create exactly one separate
   open `shape-work` handoff, then link it from the map and source receipt. Close the source ticket
   only after the evidence, handoff and both links are inspectable.
6. **Reconcile and report.** Re-read before updating derived indexes, preserve concurrent entries and
   keep retries idempotent. Name any graduated branch with a clickable handoff and say
   `Run shape-work on this handoff.` Wait for the user to invoke it; never start `shape-work`
   automatically. Report this ticket's outcome and the new frontier, then halt.

## Graduation and closing

A branch graduates when its remaining product decisions fit one `shape-work` interview. Graduation
creates a distinct open handoff before the canonical source decision closes; that handoff, not the
closed ticket, is the next work object. The map closes when every branch is decided, graduated,
parked or ruled out, and no Fog remains.

## Hard rules

Map approval authorizes map children, capture-only spawned issues and the planning handoff required
for graduation. It authorizes neither shaping nor implementation of spawned or graduated work.

The decision ticket is canonical; the map is a repairable index rebuilt from its children.

One invocation resolves one ticket — parallelism comes from independent claims, not from a single run
doing more.

Human-in-the-loop evidence comes from the human. The agent may recommend, prototype and challenge,
but never manufacture the human's answer.

A ticket stays open until its evidence supports the recorded decision, and scope discoveries become
children, spawned issues, graduated branches or parked paths rather than silent additions.

Decision tickets graduate through `shape-work`. `batch-work` never consumes unresolved chart tickets
directly.
