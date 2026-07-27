---
name: chart-work
description: Charts broad or foggy work as a parallel graph of evidence-backed decision tickets, including valuable side paths and independently shapeable branches. User-invoked when an effort spans several decision threads or sessions, before shaping its individual branches. Not for one bounded change that fits a single shape-work interview, or for decision-ready implementation.
disable-model-invocation: true
---

# Chart work

Turn fog into decision artifacts that independent threads resolve in parallel. The map is a
low-resolution index; each ticket owns its evidence and decision.

Read the project policy for the planning surface, ticket types, blocking, claiming, spawning, and
graduation conventions. Read [references/map.md](references/map.md) before any map mutation and
[references/elicitation.md](references/elicitation.md) before resolving a ticket.

## Mode A — chart the graph

1. **Name the destination and boundaries.** State what reaching it means and what the map excludes.
2. **Chart breadth-first.** Create decision tickets for precise questions; leave only questions that
   cannot yet be stated precisely in Fog.
3. **Classify the evidence path.** Use `research`, `prototype`, `grilling`, or `task`. The type says
   how evidence is obtained; every child remains a decision ticket.
4. **Present for approval:** destination, boundaries, tickets, blocking edges, frontier, parallel
   starts, and permission to capture valuable side paths as linked ordinary issues. HALT before
   writing.
5. **Create the approved graph.** Create the map and open children, wire dependencies, and expose the
   frontier. Resolve nothing in this invocation. HALT with named starting tickets for parallel work.

## Mode B — resolve one decision ticket

1. **Orient at low resolution.** Read the map, frontier, and named ticket; load other ticket bodies
   only when evidence requires them.
2. **Claim one frontier ticket.** Re-read before claiming. If blocked or claimed, stop and select
   another frontier ticket. Refer by linked name, never bare ID.
3. **Produce evidence by type.** One worker owns one ticket. Independent workers may resolve other
   frontier tickets concurrently.
4. **Record the resolution receipt.** Close only with a decision, supporting evidence, rejected
   alternatives, route consequence, and open risks.
5. **Route consequences:** add in-scope decision children; capture valuable side paths as linked
   ordinary issues; graduate a bounded branch to `shape-work`; or park it explicitly.
6. **Reconcile the map.** Re-read before updating its derived indexes, preserve concurrent entries,
   and make retries idempotent. Report this ticket's outcome and the new frontier. HALT.

A branch graduates when its remaining product decisions fit one `shape-work` interview. Close the
map when every branch is decided, graduated, parked, or ruled out and no Fog remains.

## Hard rules

- Map approval authorizes map children and capture-only spawned issues; it never authorizes
  implementation of spawned or graduated work.
- The decision ticket is canonical and the map is a repairable index.
- One invocation resolves one ticket; parallelism comes from independent claims.
- HITL evidence comes from the human; the agent may recommend, prototype, and challenge, but never
  manufacture the human's answer.
- A ticket remains open until its evidence supports the recorded decision.
- Scope discoveries become children, spawned issues, graduated branches, or parked paths.
