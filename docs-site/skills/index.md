# Skills overview

agent-os ships ten skills in three buckets. Workflows are invoked by hand, disciplines trigger
themselves from the situation, and the meta-skill governs how the others are written.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`init-agent-os`](/skills/init-agent-os) | workflow | manual | Machine setup, or a repo policy interview |
| [`chart-work`](/skills/chart-work) | workflow | manual | Chart broad work as a parallel graph of decision tickets |
| [`shape-work`](/skills/shape-work) | workflow | manual | Interview to a decision-complete spec plus visualization |
| [`batch-work`](/skills/batch-work) | workflow | manual | Dispatch and reconcile many frozen, independent work units |
| [`deliver-work`](/skills/deliver-work) | workflow | manual | Readiness through review, verification and PR |
| [`dispatch-next`](/skills/dispatch-next) | workflow | manual | Pick exactly one decision-ready action from live state |
| [`verify-before-done`](/skills/verify-before-done) | discipline | automatic | Fresh evidence before any completion claim |
| [`diagnose-before-fix`](/skills/diagnose-before-fix) | discipline | automatic | Reproduce and root-cause before patching |
| [`scope-guard`](/skills/scope-guard) | discipline | automatic | Keep work inside the task; flag drift |
| [`writing-skills`](/skills/writing-skills) | meta | manual | Doctrine and definition of done for skills here |

## Invocation

Manual skills are opted into explicitly on both platforms. In Claude Code they carry
`disable-model-invocation: true` in their frontmatter and are typed as `/agent-os:<skill>`. In Codex
they carry an `agents/openai.yaml` with `policy.allow_implicit_invocation: false` and are typed as
`$<skill>`.

Automatic skills carry neither switch. Their description does the work instead: it names what the
skill does, the situations that should activate it, the point in the workflow to load it, and the
cases where it should be skipped. That last part matters as much as the first — a discipline that
fires on adjacent-but-wrong situations costs context on every session.

## Retirement

A retired skill moves to the repository's root `deprecated/` folder rather than being deleted. That
folder sits outside the plugin's `skills/` directory, so its contents are never distributed, and a
skill re-enters `skills/` only by passing the [definition of done](/skills/writing-skills#definition-of-done)
again.
