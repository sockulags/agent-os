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

## Loop

Read the repository, project policy, the intent and spec when they exist, and any linked `plan-work`
decisions or handoffs before asking questions. Resolve facts from those sources. For each remaining
material choice, recommend an answer, explain the consequence, and ask only what the developer must
decide. A pre-existing specification is a valid starting point; a plan-work run is not required.

A spec whose `built_on` revision is older than its intent is stale. Do not shape from it: return it
to `plan-work` for reconsideration and report which revision changed.

Use a diagram or mockup when it makes behavior, layout, states, or boundaries materially easier to
judge. Frontend proposals follow [references/mockups.md](references/mockups.md). Do not create a
visualization merely to satisfy the workflow.

When a solution-changing assumption needs observation, apply the
[experiment decision](references/prototypes.md), including small technical experiments and
comparable UI alternatives. Do not turn a question with sufficient evidence into a prototype.

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. When the spec already holds these, link it instead
of restating it. Then write the delivery units: `intents/<id>/plan.md` by default, or
create or reuse its implementation issues on the tracker when the project policy makes the tracker the source
of truth for units. Link real dependencies and expose the first claimable delivery frontier.

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
