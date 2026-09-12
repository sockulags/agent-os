---
name: plan-work
description: Plans a coherent mission from outcome through coverage, decisions, feasibility, and verification with adaptive depth and an optional decision map. User-invoked when the developer wants a plan or the work needs one. Not required for an already clear implementation request or a substitute for shape-work delivery structure.
disable-model-invocation: true
---

# Plan work

Own the coherent mission before delivery: the desired result and behavior, boundaries, affected
parts, material decisions, technical feasibility, and one verification story for the whole result.
Planning is an entry point, not a mandatory ceremony before an already clear implementation
request. Shape-work may also start from an existing specification.

## Choose planning depth internally

Do not ask the developer to select a mode. Match the depth to scope and uncertainty separately:

- A small, clear fix needs its outcome, boundaries, and verification.
- A large but known change needs repository inspection and a coverage check across the relevant
  flows, states, errors, and integrations.
- A bounded open choice needs discoverable facts first, then only focused questions for choices
  that materially change behavior.
- A broad initiative uses the decision map below when questions need independent ownership,
  separate evidence work, or parallel treatment.

Use [understand-work](../understand-work/SKILL.md) when the outcome is still moving or cannot be
stated. Use [explain-work](../explain-work/SKILL.md) when a plain-language summary is needed for an
actual decision. A summary is not a general approval gate: existing authority continues across
workflow boundaries, and planning alone never starts implementation.

## Establish the plan

Read project policy, the request, relevant repository code, existing planning artifacts, and live
worktree or tracker state before asking questions. Check the real main flows, states, error paths,
and integrations. For a rebuild or migration, identify what is preserved, replaced, migrated, and
removed. Do not invent requirements to fill a template.

Resolve repository facts yourself. Ask only a material product question, with a recommendation and
the consequence of choosing differently. Record decisions, reasons, rejected alternatives, open
risks, and evidence where the configured planning surface can be found again.

The plan owns one coherent mission, not a pile of disconnected tickets. The plan is ready when delivery
can proceed without inventing material product intent. The ready result may be:

- ready for direct delivery when the mission already has a sufficient contract;
- ready for `shape-work` when delivery units, dependencies, or an epic contract still need to be
  materialized; or
- one explicit remaining question or evidence gap.

Exact code, a complete file list, and every technical work step do not need to be decided. A plan
does not authorize product implementation, and an issue becoming ready does not authorize it.

## Decision-map mode

When the broad depth is justified, read [references/map.md](references/map.md),
[references/elicitation.md](references/elicitation.md), and
[references/prototypes.md](references/prototypes.md). Preserve these mechanics:

- the decision ticket is canonical; the map is a repairable, low-resolution index;
- ticket identity is stable and updates are idempotent;
- claim an open frontier ticket before independent work, and never infer parallel workers from a
  map with parallel possibilities;
- connect real dependencies and expose the open, unblocked frontier;
- re-read live state before writing and use compare-and-swap or the planning surface's equivalent
  to protect concurrent updates;
- hand off each bounded branch to `shape-work` through one stable, canonical handoff; shaping
  reconciles issues and readiness back into the plan.

The handoff links the canonical plan and ticket evidence. It carries a bounded summary, settled
decisions, evidence, and remaining questions; it does not copy the plan into a competing
specification.

### Reconsideration

Treat reconsideration as explicit planning information, not as an erased resolution:

1. Preserve the earlier resolution and keep it addressable.
2. Record which decision is under review, why it is being reconsidered, and the question that
   remains open.
3. Show the active reconsideration in the map and process it with the ordinary claim and frontier
   rules.
4. When it closes, record whether the earlier decision was confirmed or replaced. Register a
   replacement only after a new decision is actually made.

Use existing tracker status plus explicit reconsideration fields rather than inventing a global
status machine. Find potentially affected work through decision links, acceptance, and boundaries.
Pause only branches with demonstrated impact; independent authorized work continues.

## Authority and tracker boundaries

No planning skill grants external write access. If the request or project policy already
authorizes tracker maintenance, that may include implementation detail and technical ordering or
readiness within the authorized set. It does not silently change acceptance, ownership, delivery
scope, or closure. Without tracker authority, keep corrections local and report the unsynced
updates. If the information must survive the session, use the existing work record and add a
`Pending tracker updates` section only when needed; store a delta, not a copy of this plan.

Recommend one concrete next action at exit, with the reason it wins and any blocker. Continue into
an authorized next workflow without adding an approval ceremony; stop when the plan is ready and
the request does not include implementation.
