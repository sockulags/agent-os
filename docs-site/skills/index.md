---
title: Skills overview
description: The agent-os workflows, automatic disciplines, and meta-skill with their invocation boundaries.
---

# Skills overview

agent-os ships its skills in three buckets. Workflows are invoked by hand, disciplines trigger
themselves from the situation, and the meta-skill governs how the others are written.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`init-agent-os`](/skills/init-agent-os) | workflow | manual | Managed policy setup or repository defaults |
| [`chart-work`](/skills/chart-work) | workflow | manual | Chart broad work as a parallel graph of decision tickets |
| [`shape-work`](/skills/shape-work) | workflow | manual | Turn bounded choices into implementation-ready issues |
| [`batch-work`](/skills/batch-work) | workflow | manual | Run isolated ready units and verify the integrated result |
| [`deliver-work`](/skills/deliver-work) | workflow | manual | Implement one change against boundaries and ground truth |
| [`dispatch-next`](/skills/dispatch-next) | workflow | manual | Pick or dispatch one action according to the request |
| [`guide-me`](/skills/guide-me) | workflow | manual | Guide a vague desire to an approved goal and into planning |
| [`understand-work`](/skills/understand-work) | workflow | manual | Question out the need behind a stated wish |
| [`explain-work`](/skills/explain-work) | workflow | manual | Explain the task in plain language for approval |
| [`record-lesson`](/skills/record-lesson) | workflow | manual | Record a durable lesson in repo or global policy |
| [`verify-before-done`](/skills/verify-before-done) | discipline | automatic | Fresh evidence before any completion claim |
| [`diagnose-before-fix`](/skills/diagnose-before-fix) | discipline | automatic | Reproduce and root-cause before patching |
| [`scope-guard`](/skills/scope-guard) | discipline | automatic | Keep work inside the task; flag drift |
| [`notice-lesson`](/skills/notice-lesson) | discipline | automatic | Treat interruptions as misunderstanding signals |
| [`writing-skills`](/skills/writing-skills) | meta | manual | Doctrine and definition of done for agent-os skills |

## Invocation

Manual skills are opted into explicitly on both platforms. In Claude Code they carry
`disable-model-invocation: true` in their frontmatter and are typed as `/agent-os:<skill>`. In Codex
they carry an `agents/openai.yaml` with `policy.allow_implicit_invocation: false` and are typed as
`$<skill>`.

Automatic skills carry neither switch. Their descriptions name the situation and boundary clearly
enough to trigger only when useful.

## Retirement

A retired skill moves to the repository's root `deprecated/` folder rather than being deleted. That
folder sits outside the plugin's `skills/` directory, so its contents are never distributed, and a
skill re-enters `skills/` only by passing the [definition of done](/skills/writing-skills#definition-of-done)
again.
