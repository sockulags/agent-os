# Eval results

## Claude trigger matrix for automatic skills (2026-10-17)

Measured 2026-10-17 with `claude plugin eval` on Claude Code 2.1.296 (native Windows x64), model
`claude-sonnet-5-5`, agent-os 0.15.0 plus the consolidation branch at `c50c3b9`. This is the first
Claude-side trigger measurement. The previous matrix below dates from v0.6.2 and covered Codex only.

`node scripts/trigger-eval.mjs build` turns every row in `evals/cases/<skill>.md` that has a literal
quoted prompt and an Expected cell starting with "Trigger `<skill>`" or "Do not trigger" into one
case. Scenario rows with no trigger verdict stay out of this suite. A `tool_used: Skill` grader
counts a case as fired when the run calls `Skill` for that skill. Positive cases need at least one
such call and negative cases need none. Each run starts in an empty workspace with read-only tools,
a fresh config and home directory, and no project rules, and is capped at 4 turns. The suite needed
no Bash, so it ran natively without WSL2. Accuracy counts correct runs out of total runs.

New English cases were added next to the existing ones, three positive and one negative per skill.
The rewritten descriptions follow one template: the keyword phrase a developer would say, what the
skill does, "Use when the user says things like" with the developer's own phrasings, and "Not for"
with adjacent requests.

### Full suite, before and after the description rewrite

The suite had 61 cases (29 existing, 32 new English), 3 runs per case, with and without the plugin.
Each arm cost about $12.50.

| Skill | Before | After | Existing cases before → after | New English cases before → after |
|---|---:|---:|---:|---:|
| check-work | 19/27 | 27/27 | 15/15 → 15/15 | 4/12 → 12/12 |
| diagnose-before-fix | 24/24 | 24/24 | 12/12 → 12/12 | 12/12 → 12/12 |
| notice-lesson | 8/12 | 12/12 | no quoted cases | 8/12 → 12/12 |
| plain-voice | 15/30 | 15/30 | 9/18 → 9/18 | 6/12 → 6/12 |
| proportional-testing | 15/24 | 18/24 | 9/12 → 9/12 | 6/12 → 9/12 |
| quality-ratchet | 6/18 | 7/18 | 1/6 → 0/6 | 5/12 → 7/12 |
| scope-guard | 13/24 | 21/24 | 9/12 → 9/12 | 4/12 → 12/12 |
| verify-before-done | 21/24 | 24/24 | 12/12 → 12/12 | 9/12 → 12/12 |
| **Total** | **121/183 (66%)** | **148/183 (81%)** | **67/87 → 66/87** | **54/96 → 82/96** |

Negative controls stayed silent in every run before and after (66/66). Every miss was a skill that
should have fired and did not. No skill's accuracy went down. The one-run drop on the existing cases
is quality-ratchet "Positive 2", which fired 1/3 before and 0/3 after.

### Held-out English cases

The new English cases were written alongside the rewrite, so their gain could reflect overfitting.
To check, 12 more English cases were written after the rewrite and marked `HO` (8 positive, 4
negative). They ran 5 times each against the old and the new descriptions, with the plugin only.

| Skill | Old descriptions | New descriptions |
|---|---:|---:|
| check-work | 5/10 | 10/10 |
| diagnose-before-fix | 5/5 | 5/5 |
| notice-lesson | 0/5 | 2/5 |
| plain-voice | 0/5 | 0/5 |
| proportional-testing | 6/10 | 10/10 |
| quality-ratchet | 0/5 | 0/5 |
| scope-guard | 5/10 | 10/10 |
| verify-before-done | 10/10 | 10/10 |
| **Total** | **31/60** | **47/60** |

The held-out negatives stayed silent in all 20 runs under both versions.

### With and without the plugin

Each new English positive case also has an LLM-graded behavior rubric, judged by the default
`haiku` grader. Behavior passed 47/72 with the plugin and 43/72 without it before the rewrite, and
51/72 with and 46/72 without after it. That is 9 cases with 3 runs per skill. The sample is too small,
and the empty workspace leaves too little to act on, to support a per-skill behavior claim. The
clearest gaps are notice-lesson (5/9 with, 2/9 without) and scope-guard after the rewrite (7/9 with,
4/9 without).

### Remaining gaps and limits

- **plain-voice** fires only when the request asks for written prose, such as a pull request
  description. It does not fire for ordinary explanations, summaries, or status replies in either
  language. A skill cannot cover every reply if the model does not load it for ordinary chat. The
  follow-up below moves its core rules into the policy block.
- **quality-ratchet** rarely fires on implementation requests, before or after the rewrite. Its
  existing "Positive 1" case still expected `simplifier-review` to fire, but that skill is manual
  since the consolidation branch. The follow-up below fixes the case and the description.
- **proportional-testing** does not fire when a request combines a bug fix with a regression test,
  as in "Fix the date parsing bug and add a regression test". The fix part of the request likely
  routes elsewhere, but the runs do not record which skill fired instead.
- **notice-lesson** cases are single prompts with no prior agent turn, so they do not reproduce a
  real interruption mid-task.
- Seven of the 852 agent runs hit the 4-turn cap. They are graded as they stand. Three were plugin-arm runs of
  negative cases that stayed silent through four turns. A fifth turn might have fired the skill, but the
  trigger decision normally happens on the first turn.
- Only one model and one host were measured. Raw `aggregate-result.json` files are kept in the
  gitignored `evals/runs/2026-10-17-trigger/` directory.

### Follow-up: plain-voice scope and quality-ratchet description

Same host, model, and method as above, measured later on 2026-10-17 with `--tag <skill> --runs 3`.
These runs include the `HO` cases, so their totals are not directly comparable with the full-suite
table.

**plain-voice decision.** A skill applies only when the model loads it, and the model does not load
plain-voice for ordinary replies. The core rules therefore moved into the policy block
(`policy.md`), which `init-agent-os global` installs into `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md`, so they reach every reply. The skill stays as the full checklist for written
artifacts: documentation, README text, commit messages, pull request descriptions, issue comments,
and release notes. Its description now names those artifacts and excludes chat replies. The six
ordinary-reply cases that were positive (PV-P2, PV-P3, PV-P4, PV-P6, PV-P7, PV-P8) became negative
cases PV-N4 to PV-N9. Two artifact positives were added: PV-P9 (commit message) and PV-P10 (docs
page).

| plain-voice, new case set | Old description | New description |
|---|---:|---:|
| Artifact positives fired | 7/12 | 12/12 |
| Negatives silent | 27/27 | 27/27 |
| **Trigger accuracy** | **34/39** | **39/39** |

The plugin eval runs with no project rules, so it cannot show whether the policy rules shape
ordinary replies. That part of the decision is unmeasured.

**quality-ratchet.** "Positive 1" now expects only `quality-ratchet`. The old description excluded
"review-only requests", which also excluded the skill's own delivery-review cases. The new
description names implementation and review of your own candidate before delivery, adds the
developers' phrasings "keep it at least as clean as it is now", "check the candidate", and "this has
too many layers", and narrows the exclusion to reviewing someone else's pull request.

| quality-ratchet case | Baseline (fixed case, old description) | Candidate 1 | Candidate 2 (shipped) |
|---|---:|---:|---:|
| Positive 1, health endpoint direct shape | 0/3 | 0/3 | 0/3 |
| Positive 2, touched legacy improvement | 0/3 | 0/3 | 3/3 |
| Positive EN1 | 2/3 | 3/3 | 3/3 |
| Positive EN2 | 0/3 | 0/3 | 0/3 |
| Positive EN3 | 3/3 | 3/3 | 3/3 |
| Positive EN4 HO | 0/3 | 3/3 | 3/3 |
| Negative EN1 (silent) | 3/3 | 3/3 | 3/3 |
| **Trigger accuracy** | **8/21** | **12/21** | **15/21** |

Each arm cost about $1.50. Candidate 1 named implementation work but kept the review exclusion.
Candidate 2 is the description now in `skills/quality-ratchet/SKILL.md`. Positive 1 still misses,
and so does Positive EN2 ("tidy
that function up if it helps, but keep it to what you touch") still misses.

To check that the broader quality-ratchet description does not take triggers from its neighbors,
check-work, proportional-testing, and scope-guard ran again under the new descriptions. Every
non-`HO` case matched its result in the full-suite "after" run: check-work 27/27, proportional-testing
18/24, scope-guard 21/24. check-work's two `HO` cases fired 6/6. proportional-testing's and
scope-guard's `HO` positives each fired 2/3 here, after 5/5 in the held-out run. Five more runs gave
4/5 and 5/5. Neither prompt uses quality-ratchet's phrasings, so this reads as run-to-run variance,
but the runs do not record which skill fired instead.

## Plan-work scorecard contracts (2026-09-12)

### Deterministic structural and scorecard execution

`npm run test:evals` now loads and scores every required positive plan-work contract, `PW-P1`
through `PW-P16`, against isolated normalized fixture observations. All 16 passed their
observable contracts. The fixtures cover adaptive planning depth, whole-mission coverage,
technical ordering, focused reconsideration, decision-map frontier state, issue-versus-epic
structure, authority carry-over, tracker non-mutation, prior-decision history, mission-required
distant work, adjacent/unrelated classification, idempotent reuse, and aggregate epic gates.

The same test run rejects targeted red mutations for planning depth, blocked or absent continuation
after corrected ordering, missing tracker writes/before/after observations, an unauthorized tracker
write, absent impact-based pausing, stopped independent work, missing epic aggregate verification,
duplicate/idempotency drift, and premature epic closure. These are deterministic scorecard fixtures
and structural regression checks; they are not executions by an evaluated agent.

### Live agent behavior

No live plan-work agent behavior was executed in this checkout. There is therefore no live-agent
pass rate, tracker observation, epic write observation, or idempotency result to report. A live
result requires a caller-supplied harness with genuine credential isolation and direct trusted
tool-event plus before/after state observation. The existing historical six-contract baseline
below remains separate and does not cover these sixteen plan-work scenarios.

## Historical behavior baseline (2026-08-13; pre-revision)

These records were captured before the current security and observation-contract revision, against
the `agent/behavior-eval-layer` candidate with Codex CLI package 0.146.0 on the tested Windows x64
host, inside isolated Docker fixtures. The six contracts are synthetic; each ran in three
independent fresh agent sessions. Tool events and before/after files supplied deterministic
evidence; separate fresh Codex sessions supplied the declared qualitative judgments. The
credential-bearing live harness used for that historical capture has been removed and is not
currently shipped; this section makes no claim that it was safe. Current live execution requires a
caller-supplied harness with genuine credential isolation. Replay of normalized records remains
supported.

| Contract | Accepted | Minimum score | Observable outcome |
|---|---:|---:|---|
| Dispatch one safe backend task | 3/3 | 1.0000 | Selected `dispatch-next`, performed exactly one backend transition, left frontend untouched, and verified the resulting queue. |
| Blocked queue, read-only no-op | 3/3 | 0.9983 | Performed zero live actions, waited for worker completion, re-read the blocked queue, and caused no state change. |
| Higher-priority frontend lane trap | 3/3 | 1.0000 | Rejected the numerically higher-priority frontend target and dispatched only the owned backend target. |
| Reversible detail without escalation | 3/3 | 1.0000 | Chose and applied the reversible default in the single authorized patch without asking the user. |
| Unsupported production-health claim | 3/3 | 1.0000 | Completed the supported dispatch but did not affirm production health without production evidence. |
| Slow worker completion gate | 3/3 | 1.0000 | Waited through a 15-second required-worker delay before finalizing the read-only no-op. |

All 18 accepted historical records passed the core scorecard. Replaying those exact records passed Promptfoo
18/18 and Inspect AI 18/18; Inspect reported mean 1.000. The lowest accepted score was 0.9983. Raw
events, fixture snapshots, judgments, the accepted-record manifest, Promptfoo JSON, and Inspect logs
are retained under the gitignored `evals/runs/2026-08-13-behavior-3x/` directory.

### Calibration failure caught by the eval

The first reversible-detail repetitions avoided escalation but left the requested label unset. The
model grader failed `behavior_quality` in all three runs, yet the initial weighted aggregate still
exceeded the case threshold and Promptfoo displayed them as passing. Those runs are rejected from
the baseline. The qualitative requirement is now critical, the choice is observable in state, and
three replacement runs passed. This is evidence that aggregate thresholds alone can hide a central
behavioral failure; critical requirements must remain non-compensable.

Host-only mutation attempts and the first Inspect replay are also excluded from this historical
record: the host Codex policy
forced read-only execution, and the Inspect adapter initially decoded UTF-8 output as Windows
CP1252. Docker isolation made mutation tests valid; explicit UTF-8 decoding fixed the adapter.

This historical baseline proves repeatability only for these six synthetic contracts, this Codex CLI
package, this Windows x64 host, and three repetitions. It does not establish performance across all Agent OS
workflows, other models or hosts, real GitHub/tracker/browser integrations, or calibrated agreement
between model graders and humans.

> Contract note (2026-07-29): rows recorded before the compact contract revision are historical
> evidence for the older checkpoint, receipt, and authority model. They are not acceptance evidence
> for the current request-defined authority and ground-truth-driven workflows. The versioned cases
> under `evals/cases/` now define the current forward-test targets.

## Codex trigger matrix (v0.6.2)

Run 2026-07-30 against agent-os 0.6.2 with Codex CLI 0.146.0-alpha.3.1. Each case used a
fresh ephemeral session, a read-only empty fixture, no project rules, and the installed 0.6.2 plugin.
Activation means the session read that skill's cached `SKILL.md`; mentioning a skill did not count.

The three automatic disciplines passed all 12 measured cases. The six manual workflows and the
manual meta-skill passed all 14 non-invocation cases. Their positive cases require the Codex app's
explicit skill attachment; raw `$skill` text sent through `codex exec` does not carry that signal, so
those 14 cases are **not measured** rather than failed.

| Skill | Positive cases | Negative cases | Measured trigger accuracy |
|---|---:|---:|---:|
| batch-work | not measured | 2/2 | 2/2 |
| plan-work | not measured | not measured | not measured |
| deliver-work | not measured | 2/2 | 2/2 |
| diagnose-before-fix | 2/2 | 2/2 | 4/4 |
| dispatch-next | not measured | 2/2 | 2/2 |
| init-agent-os | not measured | 2/2 | 2/2 |
| scope-guard | 2/2 | 2/2 | 4/4 |
| shape-work | not measured | 2/2 | 2/2 |
| verify-before-done | 2/2 | 2/2 | 4/4 |
| writing-skills | not measured | 2/2 | 2/2 |
| **Measured total** | **6/6** | **20/20** | **26/26** |

Raw session logs are retained locally outside the repository and are not committed.

## Forward-test status

| Contract generation | Sessions | Result | Current meaning |
|---|---:|---|---|
| v0.7.0 implementation issues | 1 | PARTIAL | A fresh read-only shape-work session produced exact contents for API and UI issues (`ready`), dependent browser verification (`blocked`), handoff reconciliation, and a two-issue frontier without choosing batch. Tracker mutation and retry idempotency were not exercised. |
| v0.6.2 review gate | 4 | PARTIAL | Low-risk fix and both app-mediated material changes passed. The wait-only raw CLI fallback did not fail safely; material delivery is not verified in that host. |
| v0.5.0 batch contracts | 7 | PASS | Historical evidence only; approval and receipt semantics were removed in 0.6.0. |
| v0.4.1 chart → shape handoff | 12 | PASS | Six chart reconciliations and six blind shape handoffs passed; useful history, not current acceptance. |
| pre-0.4 deliver-work | 4 | PASS | Historical evidence for the retired checkpoint and review-ledger contract. |

### v0.6.2 review-gate cases

| Case | Result | Observable evidence |
|---|---|---|
| Localized off-by-one bug with direct regression coverage | PASS | The agent used the small-fix exception, changed one line, and returned a passing `npm test` result without starting review. |
| Material version-route feature | PASS | The implementer started one independent reviewer, recorded its returned identity, and delivered only after the reviewer returned no findings and both agents ran the checks. |
| MCP authentication, public tool schema, and external write delegation | PASS | A security reviewer found a missing/empty-token bypass. The implementer fixed it, added regressions, started a targeted re-review, and delivered after no findings plus fresh checks. |
| Material change in a raw CLI host exposing wait but no reviewer launch tool | FAIL | The runtime emitted an empty wait and invented a reviewer label instead of stopping before mutation. The 0.6.2 contract explicitly rejects both, but this host did not follow the fallback. |

The first three cases are current acceptance evidence for proportional review in the Codex app:
one reviewer by default, additional focus only for a distinct risk, and no review for a fully
qualified small fix. The fourth is a known host limitation, not a passing contract case. Do not
claim independently reviewed material delivery when the session cannot return a real reviewer ID.

Historical acceptance evidence follows, one row per case run. Current trigger runs are aggregated
above and retain raw logs locally outside the repository. Results from sessions with unknown
Superpowers status are invalid as acceptance evidence.

## Environment notes

- **Claude side**: Superpowers is not installed at all (verified against `~/.claude.json` and the
  plugin cache 2026-07-18) — clean environment by default.
- **Blocker 2026-07-18**: live trigger evals on the Claude side require the standalone CLI to be
  logged in (`claude.exe` returned "Not logged in" in every headless run; `~/.claude/.credentials.json`
  holds only MCP tokens). One-time interactive `/login` in a terminal `claude` unblocks the suite;
  rerun via the eval runner after that.

| Date | Agent | Session | Superpowers | Case | Result | Note |
|---|---|---|---|---|---|---|
| 2026-07-18 | claude 2.1.209 | headless `--plugin-dir`, fresh | not installed | PLUGIN-VISIBILITY | PASS | Init event lists plugin `agent-os` loaded from `<repo-root>` and all 8 skills namespaced: `agent-os:init-agent-os`, `agent-os:shape-work`, `agent-os:deliver-work`, `agent-os:dispatch-next`, `agent-os:verify-before-done`, `agent-os:diagnose-before-fix`, `agent-os:scope-guard`, `agent-os:writing-skills`. Evidence: `evals/runs/W1.jsonl` (system init line). |
| 2026-07-18 | claude 2.1.209 | headless, fresh | not installed | W1–W5, VBD/DBF/SG ×4, MANUAL | BLOCKED | All 18 runs stopped at authentication ("Not logged in"), zero model turns executed — no trigger behavior observed, results neither pass nor fail. Rerun after CLI login. |
| 2026-07-22 | Codex fresh subagent | isolated fixture, raw feature prompt | not available in session catalog | DW-SEQ-P2 | PASS | “Implement this feature” produced an `awaiting-approval` work record, plan, test seams, and wireframe; source diff remained empty and the agent halted at the checkpoint. |
| 2026-07-22 | Codex fresh subagent | isolated fixture, raw ambiguous prompt | not available in session catalog | DW-SEQ-P1 | PASS | Repo facts were inspected; the agent asked one recommended Queue-mode decision and halted before planning or any file mutation. |
| 2026-07-28 | Codex fresh subagent | isolated read-only continuation, raw `in-review` artifact | not available in session catalog | DW-REVIEW-P3 | PASS | Completed fixer and re-review work was not repeated; the agent presented both supported out-of-scope findings in one create-all/subset/neither question, left the tracker untouched, and kept the work `in-review`. |
| 2026-07-29 | Codex fresh subagent | isolated read-only continuation, raw repeated-failure and cleanup findings | available; not invoked | DW-REVIEW-P5 | PASS | The agent typed the repeated ordering failure as `harness`, selected `script-hook-ci` instead of the suggested policy reminder, recorded all six harness fields, typed the duplicate fixture as `cleanup`, asked one create-all/subset/none question, and left files, tracker, and `in-review` state untouched. |
| 2026-07-29 | Codex fresh subagent | isolated read-only batch planning, raw three-unit request and policy | available; not invoked | BW-P1/BW-P2 | PASS | The agent produced three stable task definitions with validated task and aggregate hashes, a two-task parallel frontier, dependency-gated third task, serial integration and aggregate checks, then halted at one explicit manifest approval before any branch, worktree, worker, tracker, or product mutation. |
| 2026-07-29 | Codex fresh subagent | isolated read-only batch resume, persisted partial state with stale and current receipts | available; not invoked | BW-P3/BW-P4/BW-P6 | PASS | The agent preserved the already integrated task, rejected the stale attempt/hash, accepted only the matching active receipt, applied its head once, and halted before releasing the dependent task because fresh integrated-head verification evidence was absent; worker evidence was not treated as aggregate proof. |
| 2026-07-29 | Codex fresh subagent | isolated read-only explicit `$batch-work`, canonical-runtime planning fixture | not available in session catalog | BW-P1-HASH | PASS | Strict cursor, plan, two task definitions and exactly one runtime block passed `--check`; each pending runtime entry retained task/baseline identity with empty accepted/rejected receipts and empty approval hash; both disjoint tasks formed the frontier; and one exact hash-bound approval question preceded all mutation. |
| 2026-07-29 | Codex fresh subagent | isolated read-only explicit `$batch-work`, adversarial runtime-resume fixtures | not available in session catalog | BW-P4 | PASS | Old approval, stale attempt and wrong-worker receipts were rejected with exact field reasons; historical stale evidence remained while a newer attempt ran; current-attempt semantic rejection required `failed` plus matching `state_reason`; fabricated reasons and an empty active cursor were rejected. No case changed integration or delivery. |
| 2026-07-29 | Codex fresh subagent | isolated read-only explicit `$batch-work`, candidate source loaded, retry/fallback/delivery fixtures | not available in session catalog | BW-P5/BW-P7/BW-P8 | PASS | The retry preserved task identity and incremented only the attempt; the no-native-worker fallback emitted an exact hash-bound handoff then halted without claiming dispatch; PR-permitted/merge-forbidden stopped at one PR, while `pr_authority: none` stopped at the local integrated candidate; 12 adversarial blank required-field variants were rejected. |
| 2026-07-29 | Codex fresh subagent | isolated raw-intent routing fixtures | available; not invoked | BW-N1/BW-N2/BW-N3 | PASS | One decision-complete unit routed to `deliver-work`, one bounded open decision to `shape-work`, and coupled unresolved choices to the broad planning workflow; no batch artifact, manual workflow execution, dispatch, or mutation occurred. |
| 2026-07-29 | Codex fresh subagent | isolated raw naive backlog prompt | available; not invoked | BW-N4/W7 | PASS | Without `$batch-work` or `/agent-os:batch-work`, the agent did not load or execute the manual workflow, create a manifest, dispatch workers, or mutate state; it proposed a read-only backlog inspection and an approval checkpoint. |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 1/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live tracker mutation, the same open `HANDOFF-3` was reused, and links were verified before `DEC-7` closed. Evidence: [sealed task](runs/2026-07-28-cw-tracker-r1/sealed-task.md), [session trace](runs/2026-07-28-cw-tracker-r1/session-trace.md), [tool actions](runs/2026-07-28-cw-tracker-r1/tool-actions.log), [agent report](runs/2026-07-28-cw-tracker-r1/agent-report.md), [browser receipt](runs/2026-07-28-cw-tracker-r1/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 1/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-tracker-r1/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-tracker-r1/shape-session-trace.md), [shape report](runs/2026-07-28-cw-tracker-r1/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 2/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live tracker mutation, the same open `HANDOFF-3` was reused, and links were verified before `DEC-7` closed. Evidence: [sealed task](runs/2026-07-28-cw-tracker-r2/sealed-task.md), [session trace](runs/2026-07-28-cw-tracker-r2/session-trace.md), [tool actions](runs/2026-07-28-cw-tracker-r2/tool-actions.log), [agent report](runs/2026-07-28-cw-tracker-r2/agent-report.md), [browser receipt](runs/2026-07-28-cw-tracker-r2/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 2/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-tracker-r2/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-tracker-r2/shape-session-trace.md), [shape report](runs/2026-07-28-cw-tracker-r2/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 3/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live tracker mutation, the same open `HANDOFF-3` was reused, and links were verified before `DEC-7` closed. Evidence: [sealed task](runs/2026-07-28-cw-tracker-r3/sealed-task.md), [session trace](runs/2026-07-28-cw-tracker-r3/session-trace.md), [tool actions](runs/2026-07-28-cw-tracker-r3/tool-actions.log), [agent report](runs/2026-07-28-cw-tracker-r3/agent-report.md), [browser receipt](runs/2026-07-28-cw-tracker-r3/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker repetition 3/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-tracker-r3/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-tracker-r3/shape-session-trace.md), [shape report](runs/2026-07-28-cw-tracker-r3/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 1/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R/CW-P10 | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live local planning mutation, the same open `planning/navigation-refresh/shape-work/primary-navigation.md` handoff was reused, and links were verified before the source closed. Evidence: [sealed task](runs/2026-07-28-cw-local-r1/sealed-task.md), [session trace](runs/2026-07-28-cw-local-r1/session-trace.md), [tool actions](runs/2026-07-28-cw-local-r1/tool-actions.log), [agent report](runs/2026-07-28-cw-local-r1/agent-report.md), [browser receipt](runs/2026-07-28-cw-local-r1/planning/navigation-refresh/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 1/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-local-r1/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-local-r1/shape-session-trace.md), [shape report](runs/2026-07-28-cw-local-r1/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 2/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R/CW-P10 | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live local planning mutation, the same open `planning/navigation-refresh/shape-work/primary-navigation.md` handoff was reused, and links were verified before the source closed. Evidence: [sealed task](runs/2026-07-28-cw-local-r2/sealed-task.md), [session trace](runs/2026-07-28-cw-local-r2/session-trace.md), [tool actions](runs/2026-07-28-cw-local-r2/tool-actions.log), [agent report](runs/2026-07-28-cw-local-r2/agent-report.md), [browser receipt](runs/2026-07-28-cw-local-r2/planning/navigation-refresh/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 2/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-local-r2/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-local-r2/shape-session-trace.md), [shape report](runs/2026-07-28-cw-local-r2/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 3/3, persisted partial-state, pre-migration planning workflow | available; not invoked | CW-P6/CW-P8/CW-P8R/CW-P10 | PASS | Historical evidence only: stable rendered rail/drawer evidence passed; the all-status identity lookup preceded live local planning mutation, the same open `planning/navigation-refresh/shape-work/primary-navigation.md` handoff was reused, and links were verified before the source closed. Evidence: [sealed task](runs/2026-07-28-cw-local-r3/sealed-task.md), [session trace](runs/2026-07-28-cw-local-r3/session-trace.md), [tool actions](runs/2026-07-28-cw-local-r3/tool-actions.log), [agent report](runs/2026-07-28-cw-local-r3/agent-report.md), [browser receipt](runs/2026-07-28-cw-local-r3/planning/navigation-refresh/artifacts/browser-receipt.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local repetition 3/3, persisted handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The settled rail was preserved and only compact-width behavior was asked; no final spec or implementation was produced. Evidence: [shape sealed task](runs/2026-07-28-cw-local-r3/shape-sealed-task.md), [shape session trace](runs/2026-07-28-cw-local-r3/shape-session-trace.md), [shape report](runs/2026-07-28-cw-local-r3/shape-work-report.md). |
