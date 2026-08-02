---
title: record-lesson
description: Record one durable lesson in the repo's project policy or the global agent-os policy.
skill-description: Records one durable lesson where it applies — the repo's project policy or the global agent-os policy. User-invoked when a session produced a lesson worth keeping, often after notice-lesson offers it. Not for session-specific details or facts the repository already records.
summary: Record a durable lesson in repo or global policy
---

# record-lesson

**Bucket:** workflow · **Invocation:** manual · `/record-lesson` (direct Claude), `/agent-os:record-lesson` (Claude plugin), or `$record-lesson` (Codex)

Captures a lesson while its evidence is fresh, at the narrowest level where it holds.

**Repo level** (the default): conventions, gotchas, verify commands, and delivery defaults that
hold only in this repository go to the project policy section that
[init-agent-os](/skills/init-agent-os) seeds.

**Global level:** lessons about how the developer works that would hold in a repository that has
never seen them go to `policy.md` in the agent-os repository — the source of truth behind the
managed blocks. After that edit, the developer is reminded to run `init-agent-os global` to
reinstall the blocks. An installed managed block is never edited directly; if the agent-os
repository is not reachable, the workflow stops with the exact lesson text as a handoff.

The lesson lands as the smallest rule the next agent can act on, with the observed failure or
insight that motivates it. The target is searched for an existing line with the same meaning:
updated rather than duplicated, deleted when the lesson proves it wrong, and the resulting diff is
always shown.

A machine-checkable lesson belongs in a test, script, or validator per the
[writing-skills enforcement ladder](/skills/writing-skills); it is routed there with at most a
pointer left in policy prose. [notice-lesson](/skills/notice-lesson) surfaces candidate lessons
automatically when the developer interrupts or corrects the agent.
