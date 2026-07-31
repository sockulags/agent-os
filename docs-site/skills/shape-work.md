---
title: shape-work
description: Turn one bounded idea with open product choices into implementation-ready issues.
skill-description: Shapes a bounded idea into implementation-ready issues backed by settled product decisions. User-invoked while material product choices remain. Not for small fixes or work whose outcome is already clear.
summary: Turn bounded choices into implementation-ready issues
---

# shape-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:shape-work` or `$shape-work`

Shapes a bounded idea into implementation-ready issues backed by settled product decisions.

Read the repository, policy, and linked decisions before asking questions. Resolve discoverable
facts yourself. Ask only about product choices that materially change the outcome, always with a
recommendation and its consequence.

Use a diagram or mockup only when it makes behavior, layout, states, or boundaries easier to judge.
Frontend proposals follow [Frontend mockups](/reference/mockups).

Deliver the coherent product shape: outcome, boundaries, acceptance examples, affected seams,
ground truth, settled decisions, and open risks. Then create or reuse implementation issues on the
configured planning surface, link their dependencies, and expose the first claimable frontier.

One shape may produce one or several sequential or parallel issues. Issue count does not select an
execution workflow. The developer may run any ready issue with `deliver-work`, or explicitly choose
`batch-work` for integrated parallel execution.

When shaping started from `chart-work`, reconcile issue links and readiness into the origin handoff
and map. A shaping handoff alone is not delivery-ready. Shape-work completes only when every selected
branch points to implementation-ready issues or is explicitly parked or rejected.

The invocation authorizes planning artifacts, not product code.

See [Implementation issues](/reference/implementation-issues).
