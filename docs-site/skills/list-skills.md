---
title: list-skills
description: See which agent-os skills are installed, how to invoke them on this host, and where to start.
skill-description: Lists the installed agent-os skills with their invocation syntax and purpose so the developer can see what is available and pick the right one. Use manually when the developer asks what agent-os can do, which skill fits, or for a skill list, overview, or reference card. Not for running any listed skill, choosing or dispatching the next action in planned work, or explaining work already underway.
summary: List installed skills and how to invoke them
---

# list-skills

**Bucket:** meta · **Invocation:** manual

Returns one reference card: every installed skill, how to invoke it on the current host, and what it
does.

The card is built by reading the installed skills themselves rather than a list held in the skill,
so it reflects what is actually present — including a partial or outdated installation. Invocation
comes from the same frontmatter that gates it, so explicit and automatic skills never appear under
the wrong heading.

Invocation syntax differs per host: `/agent-os:<name>` through the Claude plugin, `/<name>` for a
direct Claude install, and `$<name>` on Codex. The card names which form it is showing.

It closes with entry points for a developer who has not named a skill, and it is read-only: it never
runs, stages, or offers to run what it lists. Choosing the next action is
[`dispatch-next`](/skills/dispatch-next); describing work already underway is
[`explain-work`](/skills/explain-work).
