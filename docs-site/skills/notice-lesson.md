---
title: notice-lesson
description: Treat a developer interruption, correction, or challenge as a misunderstanding signal worth examining.
skill-description: Interruption, pushback, or correction from the user in the middle of a task. Names what was assumed and what was wanted, changes course without arguing, and offers to record a repeated correction as a lesson. Use when the user says things like no, stop, that is not what I asked, wait, why are you touching that, I said leave it alone, or you did it again. Not for ordinary clarifying questions, a requested next iteration, or a disagreement the user settles in the same message.
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
