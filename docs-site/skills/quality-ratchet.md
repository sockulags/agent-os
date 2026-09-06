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

The baseline lives in a worktree- and host-session-specific file under `git rev-parse --git-dir`. It
includes tracked dirty files and nonignored untracked files without stashing or editing them. Claude
binds the state to `CLAUDE_CODE_SESSION_ID`, Codex binds it to `CODEX_THREAD_ID`, and standalone/manual
use has a deterministic fallback. Session IDs are reduced to bounded safe path keys and the derived
identity is validated when state is read. `begin` refuses to overwrite an active baseline for the
current session. `check` records the candidate fingerprint. `clear` removes only the current session's
abandoned active baseline.

`begin`, `check`, and `clear` read the host ID from their command environment, preferring
`CODEX_THREAD_ID` when both host variables exist. Native Stop reads `session_id` from its payload,
identifies Codex by its required non-empty `turn_id`, and otherwise uses the Claude identity. If
`session_id` is absent, direct/manual hook calls retain their injected or process environment.

The Stop hook blocks corrupt or stale active evidence, unacknowledged control-policy changes,
and failed explicit project requirements. It validates recorded results without rerunning commands. Without an active baseline for the current session it is a cheap no-op. Re-entry via
`stop_hook_active` remains blocked until a fresh check; a fresh Stop then clears that session's state.
Raw structural counts never block completion. New exception signals are advisory unless the project
explicitly selects them as requirements.

## Installation

Native plugin installs use the packaged root `hooks/hooks.json` Stop hook. The same logical hook asset
is loaded by Claude Code and current Codex plugin discovery. Claude and Unix-like Codex use
`${CLAUDE_PLUGIN_ROOT}`; Windows Codex uses a quote-free `commandWindows` with a UTF-16LE PowerShell
`-EncodedCommand` payload that resolves `$env:PLUGIN_ROOT` at runtime. Node and PowerShell must be on
PATH for native plugin hooks. Direct installs merge an Agent OS-owned Stop entry into:

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

## Structure before implementation

Find existing behavior, contracts, schemas, and tests before creating parallel code. The canonical
[structure guidance](https://github.com/sockulags/agent-os/blob/main/skills/quality-ratchet/references/structure.md)
covers TypeScript schema/type ownership, React responsibilities, and Java object/module boundaries.
Cohesive single-caller extractions are allowed; arbitrary file-size limits and mandatory classes are
not. Local helpers stay near their domain until the responsibility is genuinely shared.

A fresh hook check proves evidence freshness only. Dependency evidence currently covers the root
`package.json`, not Java manifests or workspace packages. Existing project analyzers can supply
short advisory deltas outside the model. Reuse their results only when inputs, configuration, and
tool versions are unchanged. Established project rules may gate delivery; duplication and complexity
signals remain advisory. Project commands now use the same runner in manual, agent, and CI workflows; the existing Stop event
checks their evidence. No additional hook event is needed.


## Project controls

Configure `.agent-os/quality.json` to run existing architecture, lint, type, or test commands.
Checks are advisory by default; `required: true` makes nonzero exits, unavailable tools, and timeouts
block delivery. New type escapes, lint suppressions, and skipped tests are reported relative to
the entry state. No analyzer is installed automatically.

See the [configuration and examples](https://github.com/sockulags/agent-os/blob/main/skills/quality-ratchet/references/project-controls.md)
for dependency-cruiser and ArchUnit commands, policy-change acknowledgement, and CI usage.

Caching is opt-in for static checks with explicitly declared tool inputs. The first implementation
fingerprints the whole tracked/nonignored repository, declared ignored tool files, command, tool
executable, runner, configuration, runtime, and environment. It reuses only successful results
within the active session. Integration and E2E commands should remain uncached. This conservative
scope may invalidate more often than necessary and input hashing adds work to Stop. Measure it on
the target repository before enabling large tool directories; the hook has a ten-second timeout.

`check --json` prints full structured evidence. The concise default prints failures and an evidence
summary. The last full report remains beside the session state in Git's metadata directory after
successful Stop. Policy changes are held until restored or acknowledged with
`check --accept-policy-change "reason grounded in the authorized task"`. This is an audit trail,
not an independent authorization or tamper-proof enforcement boundary; use CI for protected gates.
