---
title: understand-work
description: Question out the need behind a stated wish, one load-bearing question at a time.
skill-description: Questions out what the developer actually needs behind a stated wish, one load-bearing question at a time. User-invoked directly or as the questioning stage of guide-me. Not for requests whose goal is already articulated or for facts the repository answers.
summary: Question out the need behind a stated wish
---

# understand-work

**Bucket:** workflow · **Invocation:** manual · `/understand-work` (direct Claude), `/agent-os:understand-work` (Claude plugin), or `$understand-work` (Codex)

Finds the need behind the stated wish. The deliverable is a settled understanding — what the
developer wants, why now, and what was ruled out — not a plan or a solution.

Everything the repository, project policy, and conversation already answer is resolved before any
question. Each remaining open point that materially changes the goal becomes one load-bearing
question: the concrete tension, materially different alternatives, a recommendation with its
consequence. Choices, reasons, and ruled-out directions are recorded as they land.

Silence, momentum, and approval of a larger bundle are never treated as answers, and no technical
solution is proposed while the goal is still moving.

Questioning ends when the developer says it is done or when further answers stop changing the goal.
Under [guide-me](/skills/guide-me) the settled understanding feeds the plain-language gate in
[explain-work](/skills/explain-work); standalone, it is reported directly. Chart-work's elicitation
reference points here for developer-choice evidence.
