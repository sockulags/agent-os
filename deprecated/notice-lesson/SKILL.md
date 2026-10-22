---
name: notice-lesson
description: Interruption, pushback, or correction from the user in the middle of a task. Names what was assumed and what was wanted, changes course without arguing, and offers to record a repeated correction as a lesson. Use when the user says things like no, stop, that is not what I asked, wait, why are you touching that, I said leave it alone, or you did it again. Not for ordinary clarifying questions, a requested next iteration, or a disagreement the user settles in the same message.
---

# Notice lesson

An interruption is information: the agent's model of the task and the developer's intent just
diverged.

When it happens, name the divergence in one sentence (what was assumed, what was actually wanted)
and correct course first. Then judge whether the divergence is durable: would the next session, or
an agent in a repository that has never seen this conversation, make the same mistake?

- A one-off, such as missing context, an ambiguous word, or a changed mind, needs no record; continue.
- A durable lesson, such as a convention, a preference, or a gotcha that will recur, deserves recording.
  Offer `record-lesson` with the candidate lesson already phrased.

Noticing never argues with the correction and never edits policy itself; recording is the
developer's call through `record-lesson`.
