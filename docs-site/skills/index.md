---
title: Skills overview
description: The agent-os workflows, automatic disciplines, and meta-skill with their invocation boundaries.
---

# Skills overview

agent-os ships its skills in three buckets. Workflows are invoked by hand, disciplines trigger
themselves from the situation, and the meta-skill governs how the others are written. Read this
page top to bottom: the planning foundation, the on-ramp in front of it, the remaining workflows,
and finally the component skills the workflows compose.

## The foundation: shape and chart

Planning starts here, and each layer builds on the one before it. `shape-work` turns one bounded
idea into implementation-ready issues. `chart-work` builds on it: a broad effort becomes decision
tickets, and every bounded branch ends exactly where shape-work begins.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`shape-work`](/skills/shape-work) | workflow | manual | Turn bounded choices into implementation-ready issues |
| [`chart-work`](/skills/chart-work) | workflow | manual | Chart broad work as a parallel graph of decision tickets |

## The on-ramp: guide-me

`guide-me` builds on both. When you cannot state the goal yet, it only shows the way: questioning
through its component `understand-work`, the plain-language gate through `explain-work`, and — once
you approve the summary — it ends where `chart-work` or `shape-work` begins.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`guide-me`](/skills/guide-me) | workflow | manual | Guide a vague desire to an approved goal and into planning |

## Execution and operations

The workflows that run, pick, set up, and remember work.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`deliver-work`](/skills/deliver-work) | workflow | manual | Implement one change against boundaries and ground truth |
| [`batch-work`](/skills/batch-work) | workflow | manual | Run isolated ready units and verify the integrated result |
| [`dispatch-next`](/skills/dispatch-next) | workflow | manual | Pick or dispatch one action according to the request |
| [`init-agent-os`](/skills/init-agent-os) | workflow | manual | Managed policy setup or repository defaults |
| [`record-lesson`](/skills/record-lesson) | workflow | manual | Record a durable lesson in repo or global policy |
| [`simplifier`](/skills/simplifier) | workflow | manual | Remove unnecessary code and solution layers |

## Component skills

Standalone pieces that guide-me composes. Invoke them directly whenever the piece is useful on its
own — a grilling without the routing, or a plain-language summary of any plan, diff, or pull
request.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`understand-work`](/skills/understand-work) | workflow | manual | Question out the need behind a stated wish |
| [`explain-work`](/skills/explain-work) | workflow | manual | Explain the task in plain language for approval |

## Disciplines

Always on; no invocation.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`verify-before-done`](/skills/verify-before-done) | discipline | automatic | Fresh evidence before any completion claim |
| [`diagnose-before-fix`](/skills/diagnose-before-fix) | discipline | automatic | Reproduce and root-cause before patching |
| [`scope-guard`](/skills/scope-guard) | discipline | automatic | Keep work inside the task; flag drift |
| [`notice-lesson`](/skills/notice-lesson) | discipline | automatic | Treat interruptions as misunderstanding signals |

## Meta

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`writing-skills`](/skills/writing-skills) | meta | manual | Doctrine and definition of done for agent-os skills |

## Invocation

Manual skills are opted into explicitly on both platforms. In Claude Code they carry
`disable-model-invocation: true` in their frontmatter and are typed as `/<skill>` when installed
directly or `/agent-os:<skill>` through the plugin. In Codex
they carry an `agents/openai.yaml` with `policy.allow_implicit_invocation: false` and are typed as
`$<skill>`.

Automatic skills carry neither switch. Their descriptions name the situation and boundary clearly
enough to trigger only when useful.

## Retirement

A retired skill moves to the repository's root `deprecated/` folder rather than being deleted. That
folder sits outside the plugin's `skills/` directory, so its contents are never distributed, and a
skill re-enters `skills/` only by passing the [definition of done](/skills/writing-skills#definition-of-done)
again.
