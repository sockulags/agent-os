---
title: guide-me
description: Guide the developer from a vague desire to an approved goal and into the right planning workflow.
skill-description: Guides the developer from a vague desire to work they did not know they wanted, through questioning and a plain-language gate, then continues into chart-work or shape-work. User-invoked when the developer cannot yet state what they want. Not for bounded choices, mapped decision work, or implementation-ready requests.
summary: Guide a vague desire to an approved goal and into planning
---

# guide-me

**Bucket:** workflow · **Invocation:** manual · `/agent-os:guide-me` or `$guide-me`

Takes a developer who cannot yet state what they want to an approved goal and into the right
planning workflow. Guide-me writes no product code and no implementation issues.

The workflow composes two standalone skills:

1. **Understand** — the questioning loop in [understand-work](/skills/understand-work) runs until
   the goal stops moving or the developer says it is done.
2. **Explain** — the plain-language gate in [explain-work](/skills/explain-work) summarizes the
   task with no technical vocabulary. A challenge reopens the questioning at the misunderstood
   point; nothing continues without an approved summary.

The approved summary decides the route: several independent decision threads continue into
`chart-work`, one bounded idea continues into `shape-work`, and something already small and clear
becomes a ready-to-send direct request. The approval at the gate is the opt-in for that
continuation — no second prompt.

The approved summary travels as a `## TLDR` at the top of the artifact the next workflow creates,
so every map or shape opens with what the work solves in plain language. Ruled-out directions and
open questions travel with the handoff; nothing already answered is asked again.

## Transcript: from vague to approved

Condensed illustration of the full chain.

```text
User:
/agent-os:guide-me Reports feel useless for our big customers and I
don't know what to do about it.

Agent:
What do big customers actually try to do in reports that fails today?
My guess from the support archive: they filter, then want the result
out of the app. Is the pain seeing the data, or taking it with them?

User:
Taking it with them. They paste screenshots into slides today.

Agent (plain-language summary, no technical vocabulary):
"Large customers can already find the numbers they need, but the only
way to take them along is a screenshot. This work gives them a proper
way to take a filtered result with them. It will not change what they
can see, only what they can carry away."
Approve, or challenge it?

User:
Approved.

Agent:
Continuing into chart-work — several open questions remain (what
format, who may export, what counts as large). The approved summary
goes in as the TLDR at the top of the map.
```
