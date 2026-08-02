---
title: Changelog
description: What changed in each agent-os release, in plain terms.
---

# Changelog

One entry per release: what changed, and what it means for how you work. Full commit-level history
lives on [GitHub](https://github.com/sockulags/agent-os/commits/main).

## 0.9.0 — 2026-08-02

The guided installer release: agent-os can now be installed and refreshed through npm without a
repository checkout.

- **New npm CLI** — `npx @sockulags/agent-os install` guides Codex and Claude Code setup, including Claude
  install scope and optional shared-policy synchronization.
- **Updates** — `npx @sockulags/agent-os update` refreshes the selected host plugin and can resync the shared
  policy; explicit flags support repeatable automation.
- **Validation** — the package manifest, CLI tests, package contents, plugin manifests, and
  documentation version copies are checked together.

The guide-me release: agent-os now has an entry point for work you cannot articulate yet.

- **New workflow `guide-me`** — from a vague desire, through questioning, to a plain-language
  summary you approve or challenge. On approval it continues straight into `chart-work` or
  `shape-work`, carrying the summary as a `## TLDR` at the top of the artifact it creates.
- **New workflows `understand-work` and `explain-work`** — the questioning loop and the
  plain-language gate as standalone skills, composable by guide-me and invocable on their own
  against any decision, plan, diff, or pull request.
- **New discipline `notice-lesson`** — a developer interruption or correction is treated as a
  misunderstanding signal: named in one sentence, course-corrected, and offered to `record-lesson`
  when the lesson is durable. It never edits policy itself.
- **New workflow `record-lesson`** — records one durable lesson at the narrowest level where it
  holds: the repo's project policy, or the global `policy.md` behind the managed blocks.
- **Policy:** one continuation exception — a workflow may continue into the workflow its exit
  contract names once the developer approves that exit.
- **Docs:** verified Codex install commands (`codex plugin marketplace add`, `codex plugin add`),
  this changelog, a [troubleshooting page](/guide/troubleshooting), a landing-page session
  transcript, transcripts on more skill pages, and a guide-me prologue in the worked example.
- **Validation:** documentation prose may no longer hardcode skill counts — a validator check with
  a red case replaces the reminder that failed.

## 0.7.0 — 2026-07-31

Delivery-ready issues. Shape-work must materialize implementation-ready issues before a branch
counts as delivery-ready; the ready frontier belongs to the developer, and issue count never
selects an execution workflow.

## 0.6.2 — 2026-07-30

Independent review gate in deliver-work: one adversarial reviewer by default for material change, a
precisely qualified small-fix exception, and a hard stop before mutation when the host exposes no
real reviewer launch tool.

## 0.6.1 — 2026-07-30

Evidence-backed documentation: session transcripts on discipline pages and honest eval reporting
that excludes unmeasurable cases from the denominator instead of hiding them.

## 0.6.0 — 2026-07-30

Contract-driven workflows. Approval checkpoints and receipt ceremony were removed; authority now
follows the request, and workflows are governed by outcome, boundaries, and ground truth.

## 0.5.0 — 2026-07-29

Batch orchestration: the `batch-work` workflow with a coordinator-owned manifest, hash-based
definition-drift detection behind a deterministic script, isolated worker worktrees, and aggregate
verification that worker-local checks can never substitute for.

## 0.4.x — 2026-07-28 → 2026-07-29

Chart-to-shape handoffs with stable identity and idempotent retries (0.4.0–0.4.1), prototype
evidence records, and the structural validator with its red-case suite (0.4.2).

## 0.3.0 — 2026-07-28

The `chart-work` workflow — broad efforts become parallel graphs of evidence-backed decision
tickets — and this documentation site.

## 0.2.0 — 2026-07-22

Initial public release: the workflow and discipline skill set shared between Claude Code and Codex,
dual plugin manifests, and the managed global policy block.
