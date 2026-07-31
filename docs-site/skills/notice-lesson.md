---
title: notice-lesson
description: Treat a developer interruption, correction, or challenge as a misunderstanding signal worth examining.
skill-description: Treats a developer interruption, correction, or challenge as a misunderstanding signal worth examining. It activates when the developer stops the agent, contradicts its direction, or questions its output mid-task. It skips ordinary clarifying questions, requested iteration rounds, and disagreements the developer resolves in the same breath.
summary: Treat interruptions as misunderstanding signals
---

# notice-lesson

**Bucket:** discipline · **Invocation:** automatic

An interruption is information: the agent's model of the task and the developer's intent just
diverged.

When it happens, the divergence is named in one sentence — what was assumed, what was actually
wanted — and course corrects first. Then durability is judged: would the next session, or an agent
in a repository that has never seen this conversation, make the same mistake?

A one-off — missing context, an ambiguous word, a changed mind — needs no record. A durable lesson
— a convention, a preference, a gotcha that will recur — deserves recording: the discipline offers
[record-lesson](/skills/record-lesson) with the candidate lesson already phrased.

Noticing never argues with the correction and never edits policy itself; recording is the
developer's call through `record-lesson`.
