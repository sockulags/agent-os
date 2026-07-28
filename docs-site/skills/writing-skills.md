# writing-skills

**Bucket:** meta · **Invocation:** manual · `/agent-os:writing-skills` or `$writing-skills`

The doctrine every agent-os skill must follow. Load it before writing a line of a new or changed
`SKILL.md`, description, or eval case. It is not for ordinary coding tasks that do not touch skill
files.

## Descriptions

A description does exactly four jobs, in this order.

**What** the skill does, in one clause. **Triggers** — the natural situations and keywords that should
activate it, one trigger per branch, synonyms collapsed. **Timing** — when in the workflow to load it
("before writing the first line of UI code", "before opening the target file"), not just when the
topic matches. **Skip** — when not to load it; when a borderline case can be settled cheaply by a grep
or a file check, name that check briefly.

The procedure itself — steps, hard rules, sequencing — lives in the body or its references, never in
the description. A description must not become a shortened, incomplete version of the workflow.

Write in third person. Every word costs context for model-invoked skills, so cut anything already in
the body.

## Body

Keep `SKILL.md` short: aim for 400–500 words, with a hard cap of 500 lines. Workflows use ordered,
checkable steps, each ending in a completion criterion and one explicit `NEXT` or `HALT` transition.

Split a sequence into just-in-time step files after observing premature completion, so only the
current step loads and future work cannot pull attention past its gate. Reference files stay one hop
away for detail, and deterministic operations belong in `scripts/` rather than in prose
approximations.

Hard rules are observable and carry stop conditions ("abort without mutation when…"), each with its
why in the same sentence. Leading words — compact pretrained concepts such as "seam", "tracer bullet",
"red-green-refactor" — are used consistently, because they anchor both invocation and execution.

Match freedom to fragility: prose for judgment calls, templates for preferred patterns, exact scripts
for fragile operations. Paths use forward slashes, and the body is English while user-facing output
follows the language policy.

## Enforcement ladder

Choose the lowest layer that can reliably prevent the observed failure.

1. A **deterministic invariant** belongs in a test or lint rule with a red case.
2. A **fragile operation or state transition** belongs in a script, hook or CI check.
3. **Semantic judgment** belongs in a skill with trigger cases and blind forward tests.
4. A **contextual preference** belongs in project policy.
5. **Product intent or mutation authority** belongs in a decision ticket or human gate.

The choice starts from failure evidence and recurrence risk. A preference should not become
infrastructure, and a machine-checkable invariant should not remain a prose reminder.

## Anti-patterns

Delete on sight: **no-ops**, lines describing what the agent already does by default; **negation**,
prohibitions phrased negatively, which backfire where a positive phrasing exists; **duplication**, more
than one source of truth per meaning, where a link would do; **sediment**, stale layers left from old
iterations; and **sprawl**, a skill doing two jobs — which splits only when splitting reduces context
or cognitive load.

## Definition of done

A skill is not finished until all four hold.

1. Structural validation passes: the folder name equals `name`, frontmatter has `name` and
   `description`, and manual skills — all workflows plus this meta-skill — carry
   `disable-model-invocation: true` and an `agents/openai.yaml` with
   `policy.allow_implicit_invocation: false`.
2. At least two positive and two negative trigger cases exist in `evals/cases/` and pass on both
   platforms. Positive cases are naive prompts that must activate the skill; negative cases are
   adjacent prompts that must not.
3. For complex behavior, a forward test passes: a fresh agent gets the raw task and the artifact —
   never the diagnosis or the expected answer — and behaves correctly.
4. Retired skills move to the root `deprecated/` folder, never get deleted, and re-enter `skills/`
   only by passing this definition of done again.
