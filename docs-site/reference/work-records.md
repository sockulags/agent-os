---
title: Work records
description: Where delivery state lives, and the compact resume file for work without a pull request.
---

# Work records

Ordinary `deliver-work` runs need no state file. A unit from an `intents/<id>/plan.md` is claimed by
a draft pull request whose body carries `Intent-Unit: <intent-id>/<unit-key>`, the outcome, the ground
truth, and the evidence and review record as delivery proceeds. That pull request is the record, and
status is read from pull requests rather than written into the plan. See
[Intent, spec, and plan files](/reference/intents).

Use `.agent-os/work/<slug>.md` only when work is expected to span sessions without a pull request, or
when a concise handoff materially improves recovery.

```yaml
---
agent_os_work: 2
title: <work title>
status: active
next_action: <concrete continuation>
---
```

Keep five short sections:

- Outcome
- Boundaries
- Ground truth
- Decisions
- Evidence

Add **Pending tracker updates** only when an unsynced tracker delta must survive the session. Store
the delta, not a copy of the plan. Statuses such as `blocked`, `verified`, and `delivered` are
descriptive aids, not a mandatory state machine. The record is working memory, not an approval ledger
or audit receipt. Resume by reconciling it with live repository state.
