---
name: shape-work
description: Shapes a bounded idea into implementation-ready issues backed by settled product decisions. User-invoked while material product choices remain. Not for small fixes or work whose outcome is already clear.
disable-model-invocation: true
---

# shape-work

Produce the smallest set of implementation-ready issues that lets delivery proceed without inventing
product intent.

Read [references/implementation-issues.md](references/implementation-issues.md) before shaping.

## Loop

Read the repository, project policy, and any linked chart-work decisions before asking questions.
Resolve facts from those sources. For each remaining material choice, recommend an answer, explain
the consequence, and ask only what the developer must decide.

Use a diagram or mockup when it makes behavior, layout, states, or boundaries materially easier to
judge. Frontend proposals follow [references/mockups.md](references/mockups.md). Do not create a
visualization merely to satisfy the workflow.

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. Then create or reuse its implementation issues on
the configured planning surface. With no configured tracker, use the local-file fallback in the
reference. Link dependencies and expose the first claimable delivery frontier.

One shape may produce one or several sequential or parallel issues. Multiple issues do not imply
`batch-work`: each ready issue can be delivered with `deliver-work`, while `batch-work` remains an
explicit developer choice for integrated parallel execution. Do not start either workflow unless
the request includes implementation.

When shaping started from a chart-work handoff, reconcile the issue links and readiness back into
the origin handoff and map. A handoff alone is not delivery-ready. Shape-work is complete only when
every selected branch points to implementation-ready issues or is explicitly parked or rejected.

The invocation authorizes planning artifacts, not product code. A deferred product choice remains
explicit; a reversible implementation choice does not need to become a question.
