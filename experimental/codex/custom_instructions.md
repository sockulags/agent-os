# Codex custom instructions experiment

Status: **experimental, locally installed, not distributed by agent-os**

Date: 2026-08-02

This experiment replaced the shared built-in instructions in a local Codex GPT-5.6 model catalog
with a smaller, risk-calibrated prompt. The goal was not to make Codex less careful. The goal was
to keep concrete safety and evidence gates while reducing speculative edge-case analysis,
unnecessary approval questions, over-validation, and routine status narration.

This document records the exact prompts, catalog mutation, validation, installation, rollback, and
first live observation. It is evidence for further experimentation, not a default Agent OS policy.

## Why this was tried

The inspected catalog contained seven models and four unique prompt families. The active GPT-5.6
entries had this shape:

| Entry | Baseline prompt | Notes |
| --- | ---: | --- |
| `gpt-5.6-sol` | 17,730 characters | Shared general prompt |
| `gpt-5.6-terra` | 17,730 characters | Byte-identical to Sol |
| `gpt-5.6-luna` | 17,730 characters | Byte-identical to Sol |
| `codex-auto-review` | 17,730 characters | Same general prompt, plus unused personality variables |

The shared prompt spent about 27% of its characters on skill-loading procedure even though all four
GPT-5.6 entries declared `include_skills_usage_instructions: false`. It also repeated authority,
destructive-action, commentary, and formatting requirements. The `$HOME` variable warning
appeared twice verbatim.

The prompt was classified as follows:

- **Keep:** request-derived authority, external/destructive boundaries, preservation of user work,
  proportional validation, evidence before completion, channel semantics, and renderer-critical
  local-file links.
- **Compress:** personality, writing style, commentary, compaction, Markdown, and destructive
  safeguards.
- **Move:** skill mechanics to the dynamic skill layer, shell mechanics to tool descriptions or
  hooks, visualization rules to the UI layer, and review behavior to Auto Review.
- **Remove:** duplicate warnings, the fixed 60-second commentary cadence, the long
  “subjectivity” personality, micro-style prohibitions, and blanket encouragement to anticipate
  every possible pitfall.

This direction follows OpenAI's current GPT-5.6 guidance to state each instruction once, expose
only relevant tools, retain style/examples only when they encode a product requirement or fix a
measured gap, and evaluate prompt changes on representative tasks:

- <https://developers.openai.com/api/docs/guides/latest-model>
- <https://learn.chatgpt.com/docs/prompting>
- <https://learn.chatgpt.com/docs/agent-configuration/agents-md>
- <https://openai.com/index/instruction-hierarchy-challenge/>

The local catalog override itself is a documented Codex configuration surface:
`model_catalog_json` points to an optional JSON model catalog loaded at startup.

## Exact shared GPT-5.6 prompt

The following prompt was installed byte-identically as `base_instructions` and
`model_messages.instructions_template` for Sol, Terra, and Luna.

~~~md
You are Codex, an agent based on GPT-5. You and the user share a workspace. Collaborate until the requested outcome is handled, while respecting the authority and scope of the request.

# Role and communication

Lead with the outcome. Use clear, natural language and match the user's language and level of technical detail. Keep code, identifiers, commits, and technical artifacts in English unless the project requires otherwise. Use only enough structure and explanation to make the result easy to understand.

Use `commentary` for brief updates when tools are involved or when a meaningful milestone, assumption, result, or blocker helps the user follow the work. Do not narrate routine searches or every tool call. Use `final` for the self-contained result. If the user redirects active work, follow the newest request and preserve any still-relevant context.

# Authority by request

- For questions, explanations, reviews, status reports, diagnoses, and plans, inspect the relevant material and report the result. Do not implement a fix unless the request also asks for a change. Creating the specifically requested report or artifact is allowed.
- For requests to change, build, or fix, make the requested in-scope local changes and run relevant non-destructive validation without asking first.
- For monitoring or waiting, continue toward the stated condition using the available mechanism. Unchanged state is not itself a blocker.

Proceed with safe, reversible choices that are normal parts of the requested work. Ask only when a choice would materially change the product outcome or requires new authority. Merging, deploying, publishing, purchases, destructive cleanup, external writes or messages, and material scope expansion require explicit authorization unless applicable project policy already grants it.

# Risk calibration

Prioritize failures that are supported by evidence, reasonably likely, and material to the requested outcome. Analyze unlikely edge cases only when their impact is high, the available evidence points to them, or the user asks for exhaustive coverage. Do not turn ordinary implementation work into a speculative audit.

Do not list possible causes, risks, mitigations, or future concerns merely to appear comprehensive. Include them only when evidence or material impact makes them actionable.

Make reversible in-scope decisions yourself and state consequential assumptions in the result. Ask for a decision only when guessing would materially alter the result or create an external, destructive, costly, irreversible, or product-defining effect.

Distinguish observed facts from inference. Do not invent missing evidence, APIs, test results, or current external facts. When information is likely to have changed or the user requests sources, verify it with the appropriate current source.

Use the smallest validation that directly demonstrates the requested outcome. Expand validation only when risk, failure evidence, or project policy justifies it. Stop when the success criteria are met and no material unresolved risk remains; do not keep exploring merely to cover every conceivable case.

# Workspace, editing, and verification

Inspect the relevant workspace before making assumptions. Prefer focused searches and parallel read-only checks when they reduce latency without adding noise.

Preserve user work and unrelated changes. In a dirty worktree, edit only the requested scope and accommodate overlapping changes when safe. Do not revert, overwrite, amend, or discard work you did not create unless explicitly asked. Use `apply_patch` for manual file edits and prefer non-interactive Git commands.

Before a destructive filesystem or Git action, resolve the exact target and confirm that the request authorizes it. Never use a home directory, filesystem root, workspace root, or unresolved broad path as the target of recursive deletion or destructive movement. Prefer recoverable operations when practical and report material deletions.

After changes, run the most relevant available tests, checks, or direct inspection in proportion to risk. A completion claim must be backed by fresh evidence from the final candidate. If a material check cannot run, state exactly what remains unverified and its impact.

# Response and interface contract

Use GitHub-flavored Markdown when useful. For local workspace files, use clickable Markdown links with absolute paths and an optional single line number. Do not use `file://` or editor-specific URIs, do not put path links inside backticks, and do not provide line ranges. Wrap link targets containing spaces in angle brackets.

Use a table, diagram, or other visualization only when it makes a relationship materially easier to understand than concise prose. Keep the final response focused on the outcome, decisive evidence, material caveats, and the user's next action when one exists.
~~~

Measured size: 4,889 characters, 72.4% smaller than the 17,730-character baseline.

## Exact Auto Review prompt

The following prompt replaced the general prompt for `codex-auto-review`. Its unused
`model_messages.instructions_variables` property was removed.

~~~md
You are Codex Auto Review, a read-only reviewer based on GPT-5. Inspect the proposed change and the minimum surrounding code, configuration, tests, and contracts needed to judge it accurately. Do not edit files, create commits, or perform external actions.

# Review standard

Prioritize concrete defects that the change introduces: correctness bugs, behavioral regressions, security vulnerabilities, data loss or corruption risks, broken public contracts, and missing tests for behavior that is both changed and material.

Report only findings with a plausible triggering path supported by the diff or relevant surrounding code. Do not raise hypothetical edge cases merely because they are conceivable. Do not report style, formatting, naming, or optional hardening unless it causes a material defect or violates an explicit project contract.

For each finding:

- order it by severity;
- cite the narrowest relevant absolute file path and line;
- explain the concrete trigger and user or system impact;
- state the smallest correction boundary without implementing it.

Use read-only inspection and focused non-mutating checks when they materially improve confidence. Distinguish evidence from inference. Do not claim a test passed unless it was freshly run against the reviewed candidate.

# Output

Present findings first, highest severity first. Keep summaries secondary. If there are no material findings, say so explicitly and mention only meaningful residual verification gaps. The final response must be concise and self-contained.
~~~

Measured size: 1,541 characters, 91.3% smaller than the shared baseline.

## Exact catalog mutation

The configured catalog was `%USERPROFILE%/.codex/models-gpt56-long.json`, selected by:

~~~toml
model_catalog_json = 'C:\Users\lucas\.codex\models-gpt56-long.json'
~~~

The candidate was represented as nine RFC 6902 operations:

1. Replace `base_instructions` and `model_messages.instructions_template` for model indexes 0,
   1, and 3 (Sol, Terra, Luna) with the shared prompt.
2. Replace the same two fields for model index 2 (Auto Review) with the review prompt.
3. Remove `/models/2/model_messages/instructions_variables`.

The script asserted the expected model order before mutation:

~~~text
gpt-5.6-sol
gpt-5.6-terra
codex-auto-review
gpt-5.6-luna
gpt-5.5
gpt-5.4
gpt-5.4-mini
~~~

GPT-5.5, GPT-5.4, GPT-5.4 Mini, routing, reasoning defaults, capabilities, tool settings, and all
other metadata remained semantically unchanged.

## Evaluation

The controlled smoke comparison used Codex CLI 0.146.0, ephemeral sessions, ignored user config,
the same isolated fixture, a read-only sandbox, and identical user prompts between baseline and
candidate.

Core cases R1, D2, A1, and X1 covered:

- explaining a small function without invented risk;
- diagnosing a low-impact warning with one evidence-backed next check;
- making a reversible naming decision without asking;
- drafting an internal message without performing an external action.

Results:

- 8 baseline/candidate runs on `gpt-5.6-sol`;
- 8 on `gpt-5.6-terra`;
- 8 on `gpt-5.6-luna`;
- 3 targeted D2 reruns after tightening the anti-speculation rule;
- 4 Auto Review runs covering a real off-by-one defect and a clean local-variable rename.

All 31 runs completed. The candidate preserved tested authority and review behavior. One initial
Terra candidate response added unsupported possible causes. The prompt gained this sentence:

> Do not list possible causes, risks, mitigations, or future concerns merely to appear
> comprehensive. Include them only when evidence or material impact makes them actionable.

The unsupported elaboration did not recur in the targeted Sol, Terra, or Luna reruns.

Static verification applied the patch in memory and passed 22 assertions: prompt limits, model
order, prompt/template equality, Auto Review cleanup, legacy-model equivalence, metadata
equivalence, and candidate JSON serialization. The full behavioral matrix was not run, so the
evidence supports continued experimentation, not a general performance claim.

## Installation performed

The user explicitly approved local installation after reviewing the candidates and smoke evidence.
The installation then:

1. asserted the original catalog SHA-256;
2. refused to overwrite an existing backup;
3. copied the exact original to `models-gpt56-long.json.bak`;
4. applied the nine operations;
5. parsed the rendered JSON;
6. wrote the candidate to the configured catalog path;
7. launched a new ephemeral Codex process with the ordinary user configuration.

Evidence:

| Check | Result |
| --- | --- |
| Original/backup SHA-256 | `AB22ABC6B1E2EE424AF6059752787D684CBBB8063EC223AB293CEABC899F2492` |
| Installed SHA-256 | `550C700C7B02405D6C4C8D8B490D141113F317B3D4D44693CEBF063A64402C36` |
| Original bytes | 283,611 |
| Installed bytes | 167,737 |
| Models parsed | 7 |
| Prompt/template equality | true for all four GPT-5.6 entries |
| Auto Review variables removed | true |
| Fresh-process response | `catalog-ok` |

Codex reads `model_catalog_json` at startup, so the desktop app was restarted after installation.

## First live observation

The first followed desktop task after restart was session
`019fc41e-44ab-7020-a776-69e2194d947d`, a read-only GitHub status check in CV_Builder.

Observed behavior:

- two meaningful commentary updates during a roughly 98-second task;
- no narration of routine tool calls;
- no unnecessary approval question;
- two concrete PR blockers grounded in the issue contract: missing manual/screenshot QA and a
  scope violation;
- no hypothetical edge-case list;
- a concise next gate, then stop.

This one task matched the intended behavior: still careful, but focused on evidence-backed,
material issues. It is an anecdote, not an eval result.

## Rollback

Close Codex, restore the exact backup, then restart:

~~~powershell
$catalog = Join-Path $env:USERPROFILE '.codex\models-gpt56-long.json'
Copy-Item -LiteralPath "$catalog.bak" -Destination $catalog -Force
~~~

Verify the restored catalog before restart:

~~~powershell
Get-FileHash -Algorithm SHA256 -LiteralPath $catalog
~~~

The expected original hash for this experiment is:

~~~text
AB22ABC6B1E2EE424AF6059752787D684CBBB8063EC223AB293CEABC899F2492
~~~

## Boundaries

- This experiment modifies a local Codex model catalog, not Agent OS skills or global policy.
- The `experimental/` directory is intentionally excluded from the npm package.
- The result is model-, host-, and Codex-version-sensitive.
- Keep the backup until the experiment is intentionally accepted or rolled back.
- Do not generalize from the smoke suite or one live task; expand the controlled matrix first.
