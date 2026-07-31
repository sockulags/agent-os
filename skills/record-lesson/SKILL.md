---
name: record-lesson
description: Records one durable lesson where it applies — the repo's project policy or the global agent-os policy. User-invoked when a session produced a lesson worth keeping, often after notice-lesson offers it. Not for session-specific details or facts the repository already records.
disable-model-invocation: true
---

# Record lesson

Capture the lesson while its evidence is fresh, at the narrowest level where it holds.

## Choose the level

- **Repo:** conventions, gotchas, verify commands, and delivery defaults that hold only in this
  repository go to the project policy section that `init-agent-os` seeds.
- **Global:** lessons about how the developer works that would hold in a repository that has never
  seen them go to `policy.md` in the agent-os repository — the source of truth behind the managed
  blocks. After that edit, remind the developer to run `init-agent-os global` to reinstall the
  blocks. Never edit an installed managed block directly; if the agent-os repository is not
  reachable, stop with the exact lesson text as a handoff.

Default to repo level.

## Write the lesson

State the smallest rule the next agent can act on, with the observed failure or insight that
motivates it. Search the target for an existing line with the same meaning: update it rather than
duplicating, and delete a line the lesson proves wrong. Show the resulting diff.

A machine-checkable lesson belongs in a test, script, or validator per the
[writing-skills enforcement ladder](../writing-skills/SKILL.md); route it there and record at most
a pointer in policy prose.
