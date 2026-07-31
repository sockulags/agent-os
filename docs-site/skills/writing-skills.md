---
title: writing-skills
description: Write and validate compact agent-os skills with observable eval contracts.
skill-description: Doctrine for writing and validating agent-os skills, loaded before creating or editing any SKILL.md, description, or eval case in this framework. Not for ordinary coding tasks that do not touch skill files.
summary: Doctrine and definition of done for agent-os skills
---

# writing-skills

**Bucket:** meta · **Invocation:** manual · `/agent-os:writing-skills` or `$writing-skills`

Writes skills as compact agent programs rather than procedural transcripts.

A useful skill makes objective, inputs, working surface, boundaries, ground truth, loop, and exit
discoverable. It locks what success and safety mean while leaving local tactics to the agent.

The developer's request is the authority boundary. Skills do not add a second permission ceremony
for requested work. Product choices remain with the developer; deterministic transformations belong
in scripts or tests.

Delete no-ops, tactic locks, duplicate rules, sediment, audit theater, and authority theater.
Validate structure and invocation boundaries, keep positive and negative trigger cases, and use
blind forward tests for risky or complex behavior.

## Transcript: the enforcement ladder in use

Condensed from the 0.8.0 documentation session.

```text
Observed failure:
A hardcoded skill count in the documentation ("All ten should be
present") survived two releases after it stopped being true.

Ladder decision:
This is a deterministic, machine-checkable repository fact — layer 1,
not a prose reminder. A policy line saying "keep counts in sync" would
be the exact anti-pattern: a deterministic invariant left as a reminder.

Resolution:
validate-agent-os.mjs gains a DOCS_SKILL_COUNT check that rejects
hardcoded skill counts in documentation prose, with a red case in the
validator test suite proving the check fires.
```
