---
title: Prototype evidence
description: Record what a prototype exercised, what was observed, and which decision it settled.
---

# Prototype evidence

> This page orients. The canonical contract agents load is
> [`skills/plan-work/references/prototypes.md`](https://github.com/sockulags/agent-os/blob/main/skills/plan-work/references/prototypes.md).

A prototype exists to settle a decision.

Build the smallest comparison that makes the contested behavior observable. Record the question,
stable artifact, how it was exercised, the observation, the developer's decision and rationale, and
open uncertainty.

Keep observed behavior separate from judgment. Keep the artifact inspectable while the decision
depends on it. Frontend prototypes also follow [Frontend mockups](/reference/mockups).

## When to prototype

Use an experiment when an unresolved assumption could change the solution and observation is
cheaper or more decisive than further reading. Technical examples include transaction behavior,
integration limits, and performance; UI alternatives may need the developer to try them. Skip
experiments for clear routine tasks or questions settled by existing evidence.

Announce the question, artifact, decisive observation, and bounded effort budget. Isolated local
experiments may run within existing planning or implementation authority. Stop when the question
is settled or the budget expires; an inconclusive run leaves the decision open. Keep experimental
code outside production paths and use normal delivery review before promoting it. Product
preferences still require the developer's judgment.
