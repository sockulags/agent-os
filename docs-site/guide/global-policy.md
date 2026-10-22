---
title: Global policy
description: Install and maintain the shared agent-os behavior policy for Claude Code and Codex.
---

# Global policy

`policy.md` in the repository root is the source of truth for how the agent behaves on your machine,
across every project. It is installed as a managed block into `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md` by [`init-agent-os global`](/skills/init-agent-os).

You edit `policy.md`. You never edit the installed blocks.

## Core and development sections

Everything above the `## Development workflows` heading is the core policy: priority order,
authority, evidence, scope, writing rules, the opt-in rule for manual skills, the tracker mandate
rule, the rule that durable decisions live in versioned intent and spec files, and the preferences.
The `## Development workflows` section holds what only matters with code: the Git identity rule, the
manual development skills, `plan.md` and draft pull request claims, and how to treat guard hook
blocks. The installer adds that section only when agent-os-dev is installed, so a core-only install
gets the core policy alone. `init-agent-os global` ships in agent-os-dev and always installs both.

The agent-os-dev plugin carries an identical copy at
`plugins/agent-os-dev/skills/init-agent-os/policy.md`, so a plugin install can find the source; the
repository validator keeps the two equal.

## Priority order

The policy opens by stating what wins when instructions conflict:

1. A direct user instruction in the current session.
2. The repository's project policy and the nearest `CLAUDE.md` or `AGENTS.md`.
3. The active explicit workflow — an invoked agent-os skill.
4. This global policy.

The direct request stays highest. Workflows interpret it; they do not add authority the developer did
not grant or remove authority already granted inside the request's scope.

## Core rules

The rules are deliberately few, and each is written to be observable rather than aspirational.

Authority follows the request. Inspection, planning, and review remain read-only apart from their
requested artifacts; implementation authorizes in-scope repository changes. Merge, deploy,
destructive cleanup, and external effects require the request or project policy to include them.

Evidence comes before claims. Scope and diffs stay narrow. Only unresolved product decisions that
materially change the outcome are escalated; reversible implementation choices stay with the
implementer.

Scope control uses two axes: relation to the mission (required, adjacent, or unrelated) and mandate
(covered by the request and policy, or requiring a new decision or external action). Risk guides
implementation and verification and can reveal a missing decision, but risk-area membership does
not grant permission. Required covered work normally stays in scope; adjacent work is a follow-up,
and unrelated work gets no invented proposal. No skill grants tracker write access automatically.

Decisions that outlive a session live in versioned files: `intents/<id>/intent.md` and `spec.md`
beside it. They change only through a reviewed change, and a file whose `built_on` revision is older
than its source is stale until it is reconsidered. A tracker mandate lives in the project policy's
`## Tracker mandate` section.

In the development section, commits use the Git identity configured by the repository or the
current session, and never carry AI attribution or `Co-Authored-By` trailers. Responses follow the language the user is writing in, while
code, commits and technical artifacts stay English unless the project says otherwise.

The remaining rules govern how the agent writes. Lead with the outcome, so the first sentence answers
what happened or what was found. Shorten by leaving out what does not change the reader's next step,
not by compressing language into arrow chains or invented shorthand. Plain voice applies to every
reply: each sentence carries a fact, an instruction, or a number, without unsourced claims, filler,
restated questions, stacked hedges, imposed structure, or closing offers of help. An unverified
claim is stated once, plainly, and established technical terms stay in English. The
[`plain-voice`](/skills/plain-voice) skill holds the full checklist for documentation, commits, and
pull request text. Never make the reader
cross-reference a label invented earlier in the same text. Explanations belong in prose; tables are
for short enumerable facts. Tone tracks the topic, and when it is unclear whether a topic is serious,
it is.

The invocation rule: orchestration is opt-in. Manual skills such as `capture-intent`, `plan-work`,
and `explain-work` in core, and `shape-work` and `deliver-work` in dev, run only when invoked. The
automatic `check-work` review workflow may activate for a supported implicit code-review request; its
report mode is read-only and its fix mode requires explicit authority.

The development section also says that `plan.md` lists units and dependencies only, that a draft
pull request with `Intent-Unit: <intent-id>/<unit-key>` claims a unit, and that a hook block is a
boundary the agent never routes around.

## Preferences

The preferences section holds seed defaults that any project policy may override. Two are shipped:
UI feedback lands under roughly 250 ms and never blocks the next interaction, and a project keeps its
own design identity rather than imitating the look of a well-known app.

The third is structural: every repository keeps a living project policy covering useful delivery,
verification, design-system, planning, batch, and convention defaults. `init-agent-os` seeds it.

## How the block is installed

The npm installer imports `plugins/agent-os-dev/skills/init-agent-os/scripts/policy-block.mjs`, so both use the same
narrow contract: add exactly one block when none exists, update only the text inside well-formed
markers, abort without mutating anything when the markers are duplicated or malformed, and never
touch text outside the block. The npm installer syncs only the selected platforms and preflights
those targets before it installs skills. Installed copies of `init-agent-os` carry the `policy.md`
they were installed with, so the script works without a checkout. The installer passes the policy
through the same writer with or without its development section, depending on the selected packages.

Run it in check mode to see drift without writing:

```bash
node plugins/agent-os-dev/skills/init-agent-os/scripts/policy-block.mjs --check
```

Add `--platform claude`, `codex`, or `both` to choose targets; by default the script targets the
hosts present on the machine. `--source <file>` syncs from another `policy.md`, such as an edited
checkout.

Check mode never writes. It exits `0` when the target is in sync, `1` on drift or a missing file, and
`2` when the markers are malformed, the same exit code the write path uses when it aborts. An empty
target file counts as "no block", and the block becomes the whole file.

Drift is silent: nothing warns you when `policy.md` moves ahead of the installed blocks. Re-run the
npm updater with policy sync enabled or invoke `init-agent-os global` after every policy edit and
release update, and let check mode settle any doubt.

Deterministic block handling is the reason a script exists here at all. Marker surgery is exactly the
kind of fragile operation that a prose instruction performs slightly differently every time.

## Continuation

Planning and delivery exits recommend one concrete next action and why it wins. An already
authorized bounded set of shaped issues may continue sequentially; a planning-only request does
not launch delivery. Workflow exit transitions can use existing explicit authority without another
approval ceremony. Parallel batch execution remains explicitly selected by the developer.
