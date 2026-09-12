---
name: shape-work
description: Shapes a bounded mission into coherent delivery units, dependencies, and implementation-ready issues backed by settled product decisions. User-invoked when delivery structure or an epic contract still needs shaping. Not for small fixes or work whose outcome and delivery unit are already clear.
disable-model-invocation: true
---

# Shape work

Produce the smallest coherent delivery structure that lets delivery proceed without inventing
product intent. A delivery unit is the smallest independently useful or assessable result that has
its own meaningful boundary; technical layers are not delivery units by themselves.

Read [references/implementation-issues.md](references/implementation-issues.md) before shaping.

## Loop

Read the repository, project policy, and any linked `plan-work` decisions or handoffs before asking
questions. Resolve facts from those sources. For each remaining material choice, recommend an
answer, explain the consequence, and ask only what the developer must decide. A pre-existing
specification is a valid starting point; a plan-work run is not required.

Use a diagram or mockup when it makes behavior, layout, states, or boundaries materially easier to
judge. Frontend proposals follow [references/mockups.md](references/mockups.md). Do not create a
visualization merely to satisfy the workflow.

When a solution-changing assumption needs observation, apply the
[experiment decision](../plan-work/references/prototypes.md), including small technical experiments
and comparable UI alternatives. Do not turn a question with sufficient evidence into a prototype.

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. Then create or reuse its implementation issues on
the configured planning surface. With no configured tracker, use the local-file fallback in the
reference. Link real dependencies and expose the first claimable delivery frontier.

Start from one coherent delivery unit. Split only for a concrete reason such as an independently
usable or assessable result, different ownership, a separate migration, a delivery boundary, or a
material risk and verification boundary. A separate commit, session, file, or technical layer is
not enough. Keep necessary schema, API, UI, configuration, error handling, and verification with
the behavior they support.

The result may be one issue, several independent issues without an epic, or an epic with children
when one shared end result needs an owner. Before publishing, check that the whole mission is
covered, each issue contributes, dependencies are real, and the complete set can be verified.

One shape may produce one or several sequential or parallel issues. Multiple issues do not imply
`batch-work`: each ready issue can be delivered with `deliver-work`, while `batch-work` remains an
explicit developer choice for integrated parallel execution. Do not start either workflow unless
the request includes implementation.

When shaping started from a plan-work handoff, reconcile the issue links and readiness back into the
origin handoff and map. A handoff alone is not delivery-ready. Shape-work is complete only when
every selected branch points to implementation-ready issues or is explicitly parked or rejected.

An epic has an explicit contract in [implementation issues](references/implementation-issues.md):
shared outcome and acceptance, children or delivery units, aggregate verification, and an owner
for final verification. A child issue does not authorize the rest of the epic or permit closing its
parent. `deliver-work` performs aggregate verification when the request covers the epic;
`batch-work` uses the same contract for an explicitly selected integrated run.

Planning-surface writes do not grant product implementation or external tracker authority. When
tracker maintenance is authorized, keep it within the requested set and do not silently change
acceptance, ownership, delivery scope, or closure. A ready issue is not an authorization. Without
that mandate, keep corrections local and report the pending tracker delta.

Recommend one concrete next action with its reason and blocker, weighing uncertainty and downstream
work unlocked as well as project priority. A ready frontier alone is not enough guidance. Continue
into authorized sequential delivery only when the request includes that bounded implementation;
otherwise finish with the recommendation.

The invocation authorizes planning artifacts, not product code. A deferred product choice remains
explicit; a reversible implementation choice does not need to become a question.
