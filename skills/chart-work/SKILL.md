---
name: chart-work
description: Charts broad or foggy work as a parallel graph of evidence-backed decision tickets, including valuable side paths and independently shapeable branches. User-invoked when an effort spans several decision threads or sessions, before shaping its individual branches. Not for one bounded change that fits a single shape-work interview, or for decision-ready implementation.
disable-model-invocation: true
---

# Chart work

Turn fog into decisions independent threads resolve in parallel. The map is an index; each ticket
owns its evidence and decision.

Read project policy plus [references/map.md](references/map.md) before map mutation and
[references/elicitation.md](references/elicitation.md) before ticket resolution. When a ticket uses
or converts to `prototype`, read [references/prototypes.md](references/prototypes.md); frontend
prototypes also require the shared
[frontend mockup contract](../shape-work/references/mockups.md).

## Mode A — chart the graph

1. **Name the destination and boundaries.** State the finish and exclusions.
2. **Chart breadth-first.** Create tickets for precise questions; keep the rest in Fog.
3. **Classify the evidence path.** Use `research`, `prototype`, `grilling`, or `task`; every child
   remains a decision ticket.
4. **Present for approval:** destination, boundaries, tickets, blocking edges, frontier, parallel
   starts, and side-path capture as linked ordinary issues. HALT before writing.
5. **Create the approved graph.** Create the map and open children, wire dependencies, expose the
   frontier, and resolve nothing. HALT with named parallel starting tickets.

## Mode B — resolve one decision ticket

1. **Orient.** Read the map, frontier, and named ticket; load other tickets only when evidence
   requires them.
2. **Claim one frontier ticket.** Re-read before claiming. If blocked or claimed, stop and select
   another frontier ticket. Refer by linked name, never bare ID.
3. **Produce evidence by type.** Independent workers may resolve other frontier tickets concurrently.
4. **Route consequences.** Prepare the decision, supporting evidence, rejected alternatives, route
   consequence, new work, and open risks while the source ticket remains open.
5. **Create or reuse the graduation handoff.** For a graduating branch, create exactly one separate
   open `shape-work` handoff, then link it from the map and the source receipt. Close the source
   ticket only after the evidence, handoff, and both links are inspectable.
6. **Reconcile and report.** Re-read and preserve concurrent entries; keep retries idempotent. Name
   any graduated branch with a clickable handoff and say `Run shape-work on this handoff.` Await the
   user's invocation; do not start `shape-work`. Report the outcome and frontier. HALT.

A branch graduates when its remaining product decisions fit one `shape-work` interview. Close the
map when every branch is decided, graduated, parked, or ruled out and no Fog remains.

## Hard rules

- Map approval authorizes map children, capture-only spawned issues, and the planning handoff; it
  authorizes neither shaping nor implementation.
- The decision ticket is canonical and the map is a repairable index.
- One invocation resolves one ticket; parallelism comes from independent claims.
- HITL evidence comes from the human; the agent may recommend, prototype, and challenge, but never
  manufacture the human's answer.
- A ticket remains open until its evidence supports the recorded decision.
- Scope discoveries become children, spawned issues, graduated branches, or parked paths.
- Decision tickets graduate through `shape-work`; `batch-work` never consumes unresolved chart
  tickets directly.
