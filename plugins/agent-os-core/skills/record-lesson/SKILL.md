---
name: record-lesson
description: Interruption, pushback, or correction from the user in the middle of a task, and recording the durable lesson behind it. Names what was assumed and what was wanted, changes course without arguing, and offers to record a repeated correction in the project or global policy. Use when the user says things like no, stop, that is not what I asked, wait, why are you touching that, I said leave it alone, you did it again, or remember this next time. Not for ordinary clarifying questions, a requested next iteration, a disagreement the user settles in the same message, or session-specific details.
---

# Record lesson

An interruption is information: the agent's model of the task and the person's intent just
diverged. Correct course first, then keep the lesson only if the next session would repeat the
mistake.

## Notice

When a correction arrives, name the divergence in one sentence (what was assumed, what was actually
wanted) and change course without arguing. Then judge whether it is durable: would the next
session, or an agent in a repository that has never seen this conversation, make the same mistake?

- A one-off, such as missing context, an ambiguous word, or a changed mind, needs no record;
  continue the task.
- A durable lesson, such as a convention, a preference, or a gotcha that will recur, deserves
  recording. Offer it with the candidate lesson already phrased, and continue the task while the
  person decides.

Noticing never edits policy by itself. Record only after the person agrees, or when they ask to
record a lesson directly.

## Choose the level

- **Repo:** conventions, gotchas, verify commands, and delivery defaults that hold only in this
  repository go to the project policy section that `init-agent-os` seeds.
- **Global:** lessons about how the person works that would hold in a repository that has never
  seen them go to `policy.md` in the agent-os repository, the source of truth behind the managed
  blocks. After that edit, sync it with the `init-agent-os` policy script and
  `--source <checkout>/policy.md`, or remind the person to run `init-agent-os global` after the
  next release. Never edit an installed managed block directly; if the agent-os repository is not
  reachable, stop with the exact lesson text as a handoff.

Default to repo level.

## Write the lesson

State the smallest rule the next agent can act on, with the observed failure or insight that
motivates it. Search the target for an existing line with the same meaning: update it rather than
duplicating, and delete a line the lesson proves wrong. Show the resulting diff.

A machine-checkable lesson belongs in a test, script, hook, or validator rather than in prose; route
it there and record at most a pointer in policy prose.
