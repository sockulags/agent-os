---
title: record-lesson
description: Notice a correction, change course without arguing, and record the durable lesson behind it.
skill-description: Interruption, pushback, or correction from the user in the middle of a task, and recording the durable lesson behind it. Names what was assumed and what was wanted, changes course without arguing, and offers to record a repeated correction in the project or global policy. Use when the user says things like no, stop, that is not what I asked, wait, why are you touching that, I said leave it alone, you did it again, or remember this next time. Not for ordinary clarifying questions, a requested next iteration, a disagreement the user settles in the same message, or session-specific details.
summary: Notice a correction and record the durable lesson behind it
---

# record-lesson

**Bucket:** discipline · **Invocation:** automatic

An interruption is information: the agent's model of the task and the person's intent just
diverged. record-lesson corrects course first, then keeps the lesson only if the next session would
repeat the mistake. It merges the former `notice-lesson`, which noticed the correction, with the
former manual `record-lesson`, which wrote it down. Asking for a lesson to be recorded directly
still works.

## Notice

When a correction arrives, the agent names the divergence in one sentence (what was assumed, what
was wanted) and changes course without arguing. A one-off, such as missing context or a changed
mind, needs no record. A durable lesson, such as a convention, a preference, or a recurring gotcha,
is offered with the candidate text already phrased while the task continues. Nothing is written
until the person agrees.

## Record

**Repo level** (the default): conventions, gotchas, verify commands, and delivery defaults that
hold only in this repository go to the project policy section that
[init-agent-os](/skills/init-agent-os) seeds.

**Global level:** lessons about how the person works that would hold in a repository that has never
seen them go to `policy.md` in the agent-os repository, the source of truth behind the managed
blocks. After that edit, the block is synced from that checkout with the init-agent-os policy script
and `--source`, or the person is reminded to run `init-agent-os global` after the next release. An
installed managed block is never edited directly; if the agent-os repository is not reachable, the
skill stops with the exact lesson text as a handoff.

The lesson lands as the smallest rule the next agent can act on, with the observed failure that
motivates it. An existing line with the same meaning is updated rather than duplicated, a line the
lesson proves wrong is deleted, and the resulting diff is shown. A machine-checkable lesson belongs
in a test, script, hook, or validator, with at most a pointer left in policy prose.
