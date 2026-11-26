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

## Choose the enforcement

Nothing fails when an agent skips a sentence, and an agent copies the nearest example before it
reads policy. Offer the lesson at the highest of these levels that works:

1. a change that makes the mistake impossible: one owner for the state, one supported way to do the
   task, and the old way deleted so that nothing is left to copy;
2. a type, lint rule, hook, or validator whose error names what to use instead;
3. a test that fails when the behavior breaks;
4. policy prose, for judgment that nothing can check.

Levels 1 to 3 change the repository, so they need the person's agreement like any recorded lesson
and follow the project's delivery rules. When that change is larger than the current task, offer it
as a follow-up and record the prose rule until it lands. A machine-checkable lesson leaves at most a
pointer in policy prose. End the policy line with what enforces it, or `prose only`. When a
correction repeats a rule recorded as `prose only`, move it up a level instead of rewording it.
