---
title: quality-ratchet
description: Keep implementation quality from regressing without turning delivery into cleanup.
skill-description: Keeps implementation quality from regressing by comparing a candidate with its exact entry state and separating bounded touched-surface improvement from cleanup. It activates during implementation and delivery review, not for repository-wide debt hunts or line-count optimization.
summary: Compare exact entry and candidate evidence without score gates
---

# quality-ratchet

**Bucket:** discipline · **Invocation:** automatic

`quality-ratchet` is a small evidence layer for implementation work. It compares the candidate with
the exact Git worktree state at the implementation entry point. It does not score the patch, enforce
raw LOC thresholds, or replace semantic review.

## Delivery loop

When the discipline is available, `deliver-work` runs:

1. the loaded skill's `scripts/quality-delta.mjs begin` before the first mutation;
2. the bounded implementation, including behavior-preserving improvement on the touched surface;
3. the same installed runner's `check` command before `simplifier-review`;
4. the normal simplification, correctness, security, scope, independent-review, and verification
   gates.

The agent resolves `scripts/quality-delta.mjs` relative to the loaded `quality-ratchet/SKILL.md`, so
direct installations do not depend on an Agent OS checkout in the current repository.

The evidence is input to semantic judgment. A real multi-provider or runtime-selection abstraction
is not slop merely because it increases a count. One materially constraining adjacent opportunity
may be reported, while unrelated debt remains out of scope.

## Evidence and lifecycle

The check reports added, changed, and deleted source files, touched-source NLOC before/after, the
before/after status of source paths that already existed at entry, package dependency additions and
removals, and optional analyzer capability. Lizard and jscpd are optional capabilities: when absent
or not integrated, the output says `unavailable` or `detected-not-integrated`; it never says clean.
Reliable Lizard/jscpd parsing remains a follow-up rather than an install-time prerequisite.

The baseline lives in a worktree-specific file under `git rev-parse --git-dir`. It includes tracked
dirty files and nonignored untracked files without stashing or editing them. `begin` refuses to
overwrite an active baseline. `check` records the candidate fingerprint. `clear` removes an abandoned
active baseline.

The Stop hook blocks only a corrupt or active lifecycle violation: no fresh check for the current
candidate. Without an active baseline it is a cheap no-op. Re-entry via `stop_hook_active` is
allowed without another block, so the hook cannot loop. Structural signals never block completion.

## Installation

Native plugin installs use the packaged root `hooks/hooks.json` Stop hook. The same asset is loaded by
Claude Code and current Codex plugin discovery through `CLAUDE_PLUGIN_ROOT`; Node must be on PATH
for native plugin hooks. Direct installs merge an Agent OS-owned Stop entry into:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/settings.json` | `~/.codex/hooks.json` |
| Project | `<project>/.claude/settings.json` | `<project>/.codex/hooks.json` |

The corresponding direct-install runners are:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/skills/quality-ratchet/scripts/quality-delta.mjs` | `~/.codex/skills/quality-ratchet/scripts/quality-delta.mjs` |
| Project | `<project>/.claude/skills/quality-ratchet/scripts/quality-delta.mjs` | `<project>/.agents/skills/quality-ratchet/scripts/quality-delta.mjs` |

Run `node "<runner path>" begin`, `check`, or `clear`. The checkout-relative
`node skills/quality-ratchet/scripts/quality-delta.mjs ...` form is only for repository development
or a native plugin working copy where that path actually exists.

The direct installer uses the absolute Node executable and runner path, preserves unrelated keys,
events, and hook groups, and replaces only the entry carrying the stable Agent OS marker. Malformed
or ambiguous managed configuration aborts before skill or hook mutation. The install manifest remains
backward-compatible with schema 1 and records the schema 2 managed hook integration.

If a host does not show the hook after installation, update the same scope, start a new session, or
reload the plugin where the host supports it. To inspect a blocked lifecycle, run `check`; to abandon
the attempt, run `clear`. There is no uninstall command yet, so remove only the exact managed entry
manually if the integration must be disabled, preserving unrelated hooks.
