# chart-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:chart-work` or `$chart-work`

Turns fog into decision artifacts that independent threads resolve in parallel. Use it when an effort
spans several decision threads or sessions, before shaping its individual branches. Do not use it for
one bounded change that fits a single [`shape-work`](/skills/shape-work) interview, or for work that
is already decision-ready.

The map is a low-resolution index. Each ticket owns its own evidence and its own decision. Details of
both live in [Maps and decision tickets](/reference/maps-and-tickets).

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
4. **Record the resolution receipt** — decision, supporting evidence, rejected alternatives, route
   consequence, open risks. A receipt missing evidence or route consequence is a note, not a resolved
   decision.
5. **Route the consequences.** Add in-scope decision children, capture valuable side paths as linked
   ordinary issues, graduate a bounded branch to `shape-work`, or park the path explicitly.
6. **Reconcile the map.** Re-read before updating its derived indexes, preserve concurrent entries,
   keep retries idempotent, report this ticket's outcome and the new frontier, then halt.

## Graduation and closing

A branch graduates when its remaining product decisions fit one `shape-work` interview. The map
closes when every branch is decided, graduated, parked or ruled out, and no Fog remains.

## Hard rules

Map approval authorizes map children and capture-only spawned issues. It never authorizes
implementation of spawned or graduated work.

The decision ticket is canonical; the map is a repairable index rebuilt from its children.

One invocation resolves one ticket — parallelism comes from independent claims, not from a single run
doing more.

Human-in-the-loop evidence comes from the human. The agent may recommend, prototype and challenge,
but never manufacture the human's answer.

A ticket stays open until its evidence supports the recorded decision, and scope discoveries become
children, spawned issues, graduated branches or parked paths rather than silent additions.
