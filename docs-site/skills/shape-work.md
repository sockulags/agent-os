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

## Transcript: one question, then issues

Condensed illustration of the recommend-then-ask pattern.

```text
User:
/agent-os:shape-work Turn the report-export branch into ready issues.

Agent:
Settled from the tickets: CSV of the active filtered result, reuse
report-view permission, synchronous through 10,000 rows.

One product choice remains: what happens above the limit?
  a) hide the export action        — invisible, but users ask why it's gone
  b) disable it with an explanation — visible boundary, no silent failure
Recommendation: b. One sentence of UI copy, no new capability.

User:
b.

Agent:
Issues created on the planning surface:
  EXPORT-API  ready    serializer, endpoint, authorization tests
  EXPORT-UI   ready    download action, disabled state above limit
  EXPORT-E2E  blocked  depends on EXPORT-API + EXPORT-UI

Delivery frontier: EXPORT-API, EXPORT-UI. Execution is your choice —
deliver-work per issue, or batch-work if you ask for an integrated batch.
```
