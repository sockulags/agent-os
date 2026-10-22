---
title: Skills overview
description: The agent-os-core and agent-os-dev skills with their buckets and invocation boundaries.
---

# Skills overview

agent-os ships its skills in two packages. **agent-os-core** holds the skills that help any agent
work: capturing intent, planning decisions, explaining plainly, keeping scope, proving claims, and
keeping lessons. **agent-os-dev** holds the skills that need code and Git: shaping delivery units,
delivering them, reviewing, testing, simplifying, and setting up a repository, plus the hooks that
enforce them. agent-os-dev requires agent-os-core.

Within each package, workflows are invoked by hand, except `check-work`, which is an automatic
review workflow. Disciplines trigger themselves from the situation, and the meta skill lists what is
installed.

<figure class="agent-os-diagram">
  <a href="/diagrams/agent-os-workflow-overview.svg" target="_blank" rel="noopener" aria-label="Open the Agent OS workflow overview at full size">
    <img class="diagram-light" src="/diagrams/agent-os-workflow-overview.svg" alt="">
    <img class="diagram-dark" src="/diagrams/agent-os-workflow-overview-dark.svg" alt="">
  </a>
  <figcaption>The manual workflows grouped by the uncertainty or operational need they resolve. Enter at the lowest layer that still has unresolved work. The diagram predates the core and dev split and the intent files. Select the diagram to open it at full size.</figcaption>
</figure>

## The intent chain

Work that outlives a session leaves versioned files in `intents/<id>/`: `intent.md` from
`capture-intent`, `spec.md` from `plan-work`, and `plan.md` from `shape-work`. `deliver-work` claims a
unit with a draft pull request carrying `Intent-Unit: <intent-id>/<unit-key>`, and `check-work`
reviews against the spec. A small fix skips the files. See
[Intent, spec, and plan files](/reference/intents).

## agent-os-core

### Workflows

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`capture-intent`](/skills/capture-intent) | workflow | manual | Capture the need behind a wish as a versioned intent |
| [`plan-work`](/skills/plan-work) | workflow | manual | Plan a mission and write it as a versioned spec |
| [`explain-work`](/skills/explain-work) | workflow | manual | Explain or shorten work in plain language |

### Disciplines

Always on; no invocation.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`scope-guard`](/skills/scope-guard) | discipline | automatic | Keep work inside the task; flag drift |
| [`verify-before-done`](/skills/verify-before-done) | discipline | automatic | Fresh evidence before any completion claim |
| [`plain-voice`](/skills/plain-voice) | discipline | automatic | Apply plain voice to documentation, commits, and pull request text |
| [`record-lesson`](/skills/record-lesson) | discipline | automatic | Notice a correction and record the durable lesson behind it |

### Meta

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`list-skills`](/skills/list-skills) | meta | manual | List installed skills and how to invoke them |

## agent-os-dev

### Workflows

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`shape-work`](/skills/shape-work) | workflow | manual | Shape a spec into delivery units in plan.md or tracker issues |
| [`deliver-work`](/skills/deliver-work) | workflow | manual | Deliver one unit against its contract and claim it with a draft pull request |
| [`batch-work`](/skills/batch-work) | workflow | manual | Run isolated ready units and verify the integrated result |
| [`dispatch-next`](/skills/dispatch-next) | workflow | manual | Pick or dispatch one action according to the request |
| [`simplify`](/skills/simplify) | workflow | manual | Review, audit, or remove unnecessary code and solution layers |
| [`init-agent-os`](/skills/init-agent-os) | workflow | manual | Managed policy setup or repository defaults |
| [`check-work`](/skills/check-work) | workflow | automatic | Independently review a candidate and report or fix supported findings |

### Disciplines

<figure class="agent-os-diagram">
  <a href="/diagrams/agent-os-operations-quality.svg" target="_blank" rel="noopener" aria-label="Open the Agent OS operations and quality diagram at full size">
    <img class="diagram-light" src="/diagrams/agent-os-operations-quality.svg" alt="">
    <img class="diagram-dark" src="/diagrams/agent-os-operations-quality-dark.svg" alt="">
  </a>
  <figcaption>Manual setup, dispatch, simplification, and learning workflows sit beside automatic disciplines that guard implementation and review. The diagram predates the core and dev split. Select the diagram to open it at full size.</figcaption>
</figure>

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| [`diagnose-before-fix`](/skills/diagnose-before-fix) | discipline | automatic | Reproduce and root-cause before patching |
| [`proportional-testing`](/skills/proportional-testing) | discipline | automatic | Minimum meaningful regression coverage |
| [`quality-ratchet`](/skills/quality-ratchet) | discipline | automatic | Compare exact entry and candidate evidence without score gates |

The agent-os-dev hooks back several disciplines: the quality-ratchet Stop gate, and the guard hooks
described in [Guard hooks](/reference/guards).

## Invocation

Manual skills are opted into explicitly on both platforms. In Claude Code they carry
`disable-model-invocation: true` in their frontmatter and are typed as `/<skill>` when installed
directly, or `/agent-os-core:<skill>` and `/agent-os-dev:<skill>` through the plugins. In Codex
they carry an `agents/openai.yaml` with `policy.allow_implicit_invocation: false` and are typed as
`$<skill>`.

Automatic skills carry neither switch. Their descriptions name the situation and boundary clearly
enough to trigger only when useful; `check-work` may also be explicitly named with `report`, `fix`,
or `ci`.

## Retirement

A retired skill moves to the repository's root `deprecated/` folder rather than being deleted. That
folder sits outside both plugin roots, so its contents are never distributed, and a skill re-enters
a package only by passing the [definition of done](/reference/writing-skills)
again. `understand-work` became `capture-intent`; `notice-lesson` merged into `record-lesson`; and
`simplifier`, `simplifier-review`, and `simplifier-audit` merged into `simplify`.
