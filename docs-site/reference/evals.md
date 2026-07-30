---
title: Evals
description: Measured trigger accuracy, case design, and forward-test history for agent-os skills.
---

# Evals

Skills are prompts, and prompts regress silently. The suite measures observable contracts: whether a
skill activates in the intended situation, stays dormant next to it, and produces the required
artifact or boundary. It does not grade approval ceremony or hidden reasoning traces.

## Case design

`evals/cases/manifest.json` indexes every distributed skill. Each skill has at least two positive and
two negative cases:

- **Positive cases** exercise an automatic trigger or an explicit manual invocation.
- **Negative cases** are adjacent requests where that skill must stay dormant.
- **Forward tests** give a fresh agent the raw request and available artifacts, then grade only the
  resulting behavior.

`node scripts/validate-agent-os.mjs` rejects missing, duplicated, cross-owned, or incorrectly
polarized manifest entries. Static validation proves the case set is structurally complete. Only a
live session can measure activation and behavior.

## Current measured results

Run 2026-07-30 · agent-os 0.6.2 · Codex CLI 0.146.0-alpha.3.1 · fresh ephemeral
sessions · read-only empty fixture · no project rules.

Activation required an observed read of the installed skill's `SKILL.md`. A mention did not count.

| Skill | Positive | Negative | Measured accuracy |
|---|---:|---:|---:|
| `batch-work` | not measured | 2/2 | 2/2 |
| `chart-work` | not measured | 2/2 | 2/2 |
| `deliver-work` | not measured | 2/2 | 2/2 |
| `diagnose-before-fix` | 2/2 | 2/2 | 4/4 |
| `dispatch-next` | not measured | 2/2 | 2/2 |
| `init-agent-os` | not measured | 2/2 | 2/2 |
| `scope-guard` | 2/2 | 2/2 | 4/4 |
| `shape-work` | not measured | 2/2 | 2/2 |
| `verify-before-done` | 2/2 | 2/2 | 4/4 |
| `writing-skills` | not measured | 2/2 | 2/2 |
| **Measured total** | **6/6** | **20/20** | **26/26** |

The automatic disciplines passed all 12 trigger and non-trigger cases. The manual skills passed all
14 non-invocation cases. Their positive cases need the Codex app's explicit skill attachment; raw
`$skill` text sent through `codex exec` does not carry that signal. Those cases are excluded from the
denominator instead of being presented as failures.

## Positive and negative outcomes

| Group | Positive outcome | Negative outcome |
|---|---|---|
| Automatic disciplines | 6/6 loaded the exact target skill before acting. | 6/6 kept that skill dormant. |
| Manual workflows and meta-skill | Not measurable in this raw CLI harness. | 14/14 stayed dormant without app-mediated invocation. |

## Forward-test history

| Contract generation | Sessions | Result | Status |
|---|---:|---|---|
| v0.6.2 review gate | 4 | PARTIAL | Three proportional-review cases passed; the wait-only raw CLI fallback failed. |
| v0.5.0 batch contracts | 7 | PASS | Historical: approval and receipt semantics changed in 0.6.0. |
| v0.4.1 chart → shape handoff | 12 | PASS | Six reconciliations and six blind handoffs; historical only. |
| pre-0.4 deliver-work | 4 | PASS | Historical evidence for the retired checkpoint contract. |

The current cases separate review by materiality:

| Case | Result | Observable outcome |
|---|---|---|
| Localized bug with direct regression proof | PASS | Small-fix exception; no review agent. |
| Material feature | PASS | One real reviewer identity; no findings; fresh checks. |
| MCP auth, public schema, and external write | PASS | Review found a fail-open token case; fix, regression tests, targeted re-review, then fresh checks. |
| Material change where raw CLI exposed wait but no launch tool | FAIL | The runtime used an empty wait and invented an identity instead of stopping. |

Material delivery is therefore verified in the Codex app when a launch tool returns a real reviewer
identity. It is not verified in a wait-only host. A current trigger pass cannot promote an older
forward test into current acceptance evidence.

The complete row-level record and environment notes live in
[`evals/RESULTS.md`](https://github.com/sockulags/agent-os/blob/main/evals/RESULTS.md). Raw logs remain
local and are not committed.
