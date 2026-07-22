---
name: writing-skills
description: Doctrine for writing and validating agent-os skills, loaded before creating or editing any SKILL.md, description, or eval case in this framework. Not for ordinary coding tasks that do not touch skill files.
disable-model-invocation: true
---

# Writing skills

The doctrine every agent-os skill must follow. Load this before writing a single line of a new or changed SKILL.md.

## Descriptions

A description does exactly four jobs, in this order:

1. **What** the skill does, in one clause.
2. **Triggers**: the natural situations and keywords that should activate it. One trigger per branch; collapse synonyms.
3. **Timing**: when in the workflow to load it ("before writing the first line of UI code", "before opening the target file") — not just when the topic matches.
4. **Skip**: when NOT to load it. If a borderline case can be settled cheaply (a grep, a file check), name that check briefly.

The procedure itself — steps, hard rules, sequencing — lives in the body or its references, never in the description. A description must not become a shortened, incomplete version of the workflow.

Write in third person. Every word costs context for model-invoked skills; cut anything already in the body.

## Body

- Keep SKILL.md short: aim for 400–500 words, hard cap 500 lines.
- Ordered, checkable steps for workflows; each ends in a completion criterion and one explicit `NEXT` or `HALT` transition.
- Split a sequence into just-in-time step files after observed premature completion: load only the current step so future work cannot pull attention past its gate.
- Reference files stay one hop away for detail; deterministic operations belong in `scripts/`, never in prose approximations.
- Hard rules are observable and have stop conditions ("abort without mutation when…"), and each carries its why in the same sentence.
- Use leading words — compact pretrained concepts ("seam", "tracer bullet", "red-green-refactor") — consistently; they anchor both invocation and execution.
- Match freedom to fragility: prose for judgment calls, templates for preferred patterns, exact scripts for fragile operations.
- Forward slashes in all paths. English body; user-facing output follows the language policy.

## Anti-patterns (delete on sight)

- **No-ops**: lines the agent already does by default.
- **Negation**: prohibitions phrased negatively backfire; phrase positively where possible.
- **Duplication**: one source of truth per meaning; link, do not restate.
- **Sediment**: stale layers from old iterations; prune when editing.
- **Sprawl**: a skill doing two jobs splits only when it reduces context or cognitive load.

## Definition of done — a skill is not finished until

1. Structural validation passes: folder name equals `name`, frontmatter has `name` + `description`, manual skills (all workflows and this meta-skill) have `disable-model-invocation: true` and `agents/openai.yaml` with `policy.allow_implicit_invocation: false`.
2. At least two positive and two negative trigger cases exist in `evals/cases/` and pass on both platforms. Positive: naive prompts that must activate it. Negative: adjacent prompts that must not.
3. For complex behavior, a forward test: a fresh agent gets the raw task and the artifact — never the diagnosis or the expected answer — and behaves correctly.
4. Retired skills move to root `deprecated/`, never get deleted, and re-enter `skills/` only through this definition of done again.
