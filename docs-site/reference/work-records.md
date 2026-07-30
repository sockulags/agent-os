---
title: Work records
description: Compact resumable state for delivery work that spans sessions.
---

# Work records

Ordinary `deliver-work` runs need no state file. Use `.agent-os/work/<slug>.md` only when work is
expected to span sessions or when a concise handoff materially improves recovery.

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

Statuses such as `blocked`, `verified`, and `delivered` are descriptive aids, not a mandatory state
machine. The record is working memory, not an approval ledger or audit receipt. Resume by reconciling
it with live repository state.
