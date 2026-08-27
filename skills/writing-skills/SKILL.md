---
name: writing-skills
description: Doctrine for writing and validating agent-os skills, loaded before creating or editing any SKILL.md, description, or eval case in this framework. Not for ordinary coding tasks that do not touch skill files.
disable-model-invocation: true
---

# Writing skills

Write a skill as a compact program for an agent, not a transcript of how one successful run happened.

## Contract

Make these elements discoverable without forcing headings when prose is clearer:

- **Objective:** the observable result.
- **Inputs:** the minimum context and tools to inspect.
- **Working surface:** what the agent may create or change when the request authorizes it.
- **Boundaries:** product decisions, destructive actions, or external effects the request does not cover.
- **Ground truth:** the checks or observations that decide success.
- **Loop:** inspect, act, evaluate, and adapt.
- **Exit:** the delivered artifact, evidence, or precise blocker.

The description says what the skill does, when it applies, and when it does not. Keep execution detail
in the body.

## Freedom and control

- Lock objectives, boundaries, ground truth, and stop conditions. Let the agent choose local tactics.
- The developer's request is the authority boundary. Do not add a second approval ceremony for work
  the request already asks the agent to perform.
- Ask the developer only when an unresolved product choice would materially change the outcome.
- Use prose for judgment, examples for preferred shapes, and scripts for exact transformations.
- Add ordering only where changing the order causes a demonstrated failure.
- Keep references one hop away and load them only when the task needs them.

## Enforcement ladder

Choose the lowest layer that can reliably stop the failure:

1. **Deterministic invariant → test or lint.** Machine-checkable repository facts belong in an
   executable validator with a red case.
2. **Fragile operation → script, hook, or CI.** Put parsing, identity, idempotency, and exact writes
   behind one deterministic operation.
3. **Semantic judgment → skill plus eval.** Use prose for reasoning that depends on meaning, then
   test it with trigger cases and blind forward tests.
4. **Context or preference → policy.** Record project-specific defaults where the agent reads them
   at decision time.
5. **Product intent → developer decision.** Ask only for the unresolved choice, with a recommendation.

Start from observed failure evidence and recurrence risk. Do not promote a preference into
infrastructure or leave a deterministic invariant as a reminder.

## Anti-patterns (delete on sight)

- **No-ops**: lines the agent already does by default.
- **Tactic locks**: prescribing the method when several methods can satisfy the contract.
- **Duplication**: one source of truth per meaning; link, do not restate.
- **Sediment**: stale layers from old iterations; prune when editing.
- **Audit theater**: receipts, states, or logs that do not protect recovery, correctness, or trust.
- **Authority theater**: asking again for permission already granted by the direct request.

## Definition of done — a skill is not finished until

1. Structural validation passes: folder name equals `name`, frontmatter has `name` + `description`, and manual skills (including manual workflows and this meta-skill) have `disable-model-invocation: true` and `agents/openai.yaml` with `policy.allow_implicit_invocation: false`. Automatic skills carry neither gate.
2. At least two positive and two negative trigger cases describe the intended boundary.
3. Risky or complex behavior has a blind forward test against the observable contract, not the
   preferred reasoning trace.
4. Retired skills move to root `deprecated/`, never get deleted, and re-enter `skills/` only through this definition of done again.
