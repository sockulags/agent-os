# Work records

A work record is resumable working memory for delivery that spans sessions without a pull request.
Ordinary work needs none, and a draft pull request is the record for a claimed unit.

Keep it as `.agent-os/work/<slug>.md`:

```yaml
---
agent_os_work: 2
title: <work title>
status: active
next_action: <concrete continuation>
---
```

Record only Outcome, Boundaries, Ground truth, Decisions, and Evidence. Use the status `blocked`,
`verified`, or `delivered` when that word helps the next session resume accurately. Add a
`Pending tracker updates` section only when an authorized or reported tracker delta needs to survive
the session, and record the unsynced delta, never a copied plan.
