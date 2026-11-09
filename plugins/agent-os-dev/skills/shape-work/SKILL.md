---
name: shape-work
description: Shapes a bounded mission or accepted spec into coherent delivery units with dependencies, written as plan.md beside the spec or as implementation-ready tracker issues, backed by settled product decisions. User-invoked when delivery structure or an epic contract still needs shaping. Not for small fixes or work whose outcome and delivery unit are already clear.
disable-model-invocation: true
---

# Shape work

Produce the smallest coherent delivery structure that lets delivery proceed without inventing
product intent. A delivery unit is the smallest independently useful or assessable result that has
its own meaningful boundary; technical layers are not delivery units by themselves.

Read [references/implementation-issues.md](references/implementation-issues.md) before shaping. It
defines `plan.md`, the unit line format, and the tracker alternative.

## Unit contract

A unit is a self-contained work order, not a design document: someone holding only the unit and the
repository knows what to change, where, what done means, and how to prove it, and nothing more. The
spec stays the authority. A unit writes out what it is accountable for and cites its source, and
when the two disagree the spec wins. `built_on` already marks restated text stale when the spec
changes.

Every unit carries these fields, in its `plan.md` section or its tracker issue. Write `none` only
where that is the true answer:

- **Outcome:** the observable change once this unit is delivered, for a person or a caller, in a
  sentence or two.
- **Boundaries:** the non-goals a worker would plausibly cross, and what neighboring units own
  instead.
- **Change surface:** the modules, interfaces, and existing code to extend, found by reading the
  repository, in a few lines. It names seams and does not list steps or every file.
- **Acceptance:** the checks that decide done, written out in the unit as given, when, then or as
  assertions, one line each, each citing its spec example. Cover the behaviors this unit owns, not
  every variation. A spec example shared between units states exactly this unit's part. A bare
  pointer such as "behaviors 1 to 3" is not acceptance.
- **Ground truth:** the commands to run and the named cases or observations they must show.
- **Dependencies:** for each dependency, what this unit consumes from it, in a line.
- **Evidence and settled decisions:** only the decisions a worker could otherwise get wrong, one
  line each with its link. Do not retell the spec's decisions.
- **Delivery target:** pull request, commit, or local change.
- **Open risks:** at most three risks that could change this unit's approach, each with what to do.
  Routine engineering concerns are not risks.

Match depth to the unit: a one-line change gets one-line fields, and a typical unit fits in about
4,000 characters. A longer unit is too broad or is retelling the spec or the architecture: cut it,
or split it for one of the concrete reasons below. Do not write code or implementation steps;
choices the implementer can reverse stay with the implementer.

Before publishing, read each unit as a worker who has only it and the repository. Whatever they
would have to guess, or look up in the spec to know what done means, is missing from the unit.
Whatever would not change what they build or check comes out.

## Loop

Read the repository, project policy, the intent and spec when they exist, and any linked `plan-work`
decisions or handoffs before asking questions. Resolve facts from those sources. For each remaining
material choice, recommend an answer, explain the consequence, and ask only what the developer must
decide. A pre-existing specification is a valid starting point; a plan-work run is not required.

A spec whose `built_on` revision is older than its intent is stale. Do not shape from it: return it
to `plan-work` for reconsideration and report which revision changed.

Shape-work does not settle the interface; the spec's `## Interface` section does. Link it from the
units that build those screens instead of restating it. When that section lists a decision as
open, is missing while the work changes what a person sees or does, or a unit would change a screen
the section does not cover, return that interface question to `plan-work`, where the developer
decides it, sketches it with `design-work`, or leaves it to delivery, and keep the affected units
blocked until it is settled. A surface left to delivery blocks nothing: name in its unit what
delivery may decide. Units the open question does not touch can still be shaped. Use
a diagram when it makes dependencies or boundaries materially easier to judge.

When a solution-changing technical assumption needs observation, apply the
[experiment decision](references/prototypes.md). Do not turn a question with sufficient evidence
into a prototype.

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. Then write the delivery units to the unit
contract: `intents/<id>/plan.md` by default, or
create or reuse its implementation issues on the tracker when the project policy makes the tracker the source
of truth for units. Link real dependencies and report the first claimable delivery frontier to the
developer; it is derived from the plan and is not written into it.

Start from one coherent delivery unit. Split only for a concrete reason such as an independently
usable or assessable result, different ownership, a separate migration, a delivery boundary, or a
material risk and verification boundary. A separate commit, session, file, or technical layer is
not enough. Keep necessary schema, API, UI, configuration, error handling, and verification with
the behavior they support.

The result may be one unit, several independent units, or several units with an epic contract when
one shared end result needs an owner. Before publishing, check that the whole mission is covered,
each unit contributes, dependencies are real, and the complete set can be verified.

One shape may produce one or several sequential or parallel units. Multiple issues do not imply
`batch-work`: each ready unit can be delivered with `deliver-work`, while `batch-work` remains an
explicit developer choice for integrated parallel execution. Do not start either workflow unless
the request includes implementation.

When shaping started from a plan-work handoff, reconcile the issue links and readiness back into the
origin handoff and map. A handoff alone is not delivery-ready. Shape-work is complete only when
every selected branch points to implementation-ready units or is explicitly parked or rejected.

An epic has an explicit contract in [implementation issues](references/implementation-issues.md):
shared outcome and acceptance, children or delivery units, aggregate verification, and an owner
for final verification. A child issue does not authorize the rest of the epic or permit closing its
parent. `deliver-work` performs aggregate verification when the request covers the epic;
`batch-work` uses the same contract for an explicitly selected integrated run.

A plan built on an older spec revision is stale. Reshape it from the current spec, increase its
`rev`, and keep unit keys stable so delivered work and open pull requests still point at the right
unit.

Planning-surface writes do not grant product implementation or external tracker authority. Commit
`plan.md` and open its review only when the request or the project's delivery defaults include
that. Creating tracker issues needs the project policy's `## Tracker mandate`; keep it within the
requested set and do not silently change acceptance, ownership, delivery scope, or closure. A ready
unit is not an authorization. Without that mandate, keep corrections local and report the pending
tracker delta.

Recommend one concrete next action with its reason and blocker, weighing uncertainty and downstream
work unlocked as well as project priority. A ready frontier alone is not enough guidance. Continue
into authorized sequential delivery only when the request includes that bounded implementation;
otherwise finish with the recommendation.

The invocation authorizes planning artifacts, not product code. A deferred product choice remains
explicit; a reversible implementation choice does not need to become a question.
