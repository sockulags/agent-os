---
title: Guard hooks
description: The agent-os-dev hooks that read .agent-os/guards.json, what each blocks, and what they do not cover.
---

# Guard hooks

agent-os-dev pairs its most important rules with hooks, so they hold even when the agent forgets a
skill. A skill advises; a hook enforces. The hooks run
`quality-ratchet/scripts/guards.mjs`, which reads `.agent-os/guards.json`, Git, and the intent files.
It never runs a command the repository declares, so it needs no trust step. Without
`.agent-os/guards.json`, every guard hook does nothing.

> The canonical configuration agents load is
> [`guards.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/init-agent-os/references/guards.md).

## Configuration

```json
{
  "schema": 1,
  "protectedPaths": ["migrations/**", ".github/workflows/**"],
  "frozen": ["intents/*/intent.md", "intents/*/spec.md", "intents/*/plan.md"],
  "secretScan": true
}
```

Globs are relative to the repository root: `*` matches within one path segment and `**` across
segments. Without `frozen`, the default above applies.
[init-agent-os](/skills/init-agent-os) writes the file from repository evidence.

## Hooks per event

| Event | What it does |
|---|---|
| SessionStart | Names the intent and unit behind the current branch, the spec revision, stale specs or plans, and locked tests |
| PreToolUse | Blocks an edit to a locked test; blocks an edit to an accepted file under `frozen` while a delivery baseline is active; asks before an edit under `protectedPaths`; blocks a `git commit` that adds a likely secret when `secretScan` is on |
| Stop | The quality-ratchet delivery gate: blocks a turn that ends with a stale check or a failed required check, and releases after three re-entries on the same candidate |

A block is a boundary. The agent changes course or asks, and never reaches the same edit through
another tool or path.

## Locked tests

[diagnose-before-fix](/skills/diagnose-before-fix) commits a failing test before the fix and locks it:

```bash
node <quality-ratchet>/scripts/guards.mjs lock-test tests/export.test.js
node <quality-ratchet>/scripts/guards.mjs unlock-test tests/export.test.js
node <quality-ratchet>/scripts/guards.mjs status
```

Locks live in the Git directory and are never committed. Changing a locked test needs the developer's
explicit agreement, because it changes what counts as fixed.

## Ground truth lives in quality.json

The delivery Stop gate is the quality-ratchet Stop hook. Declare the ground truth, usually the main
test command, as a `required` check in `.agent-os/quality.json`. quality-ratchet's `check` runs it only
after the developer has trusted the repository's declared controls on that machine, and the Stop
hook blocks a turn that ends with an edit newer than the last passing check. The guard hooks
deliberately run no repository command, so they need no such trust. See
[quality-ratchet](/skills/quality-ratchet).

## Claude Code and Codex

The same hooks are registered for both hosts, from `plugins/agent-os-dev/hooks/hooks.json` for plugin
installs or merged into the host configuration by the direct installer. Differences:

- A protected path asks the developer in Claude Code. Codex has no ask decision, so the hook blocks
  with the same message, and the developer makes the edit or removes the path from
  `guards.json`.
- Codex reads file targets from `apply_patch` headers. Which tool events Codex lets `PreToolUse`
  match has not been verified on every Codex version.
- Codex runs a new or changed hook only after you trust it in `/hooks`.

## What the guards do not cover

- Writes through a shell command, such as `sed -i` or a redirect, are not inspected; only edit tools,
  patches, and `git commit` are.
- Paths compare without case on Windows and macOS, and with case elsewhere.
- A malformed `guards.json` blocks every edit except the one that repairs it.
- When the same command stages and commits, such as `git add -A && git commit`, the scan reads
  tracked changes and untracked files, because the hook runs before `git add` does.
- The secret scan looks only at lines the commit adds, with known key formats and long literal
  assignments to names such as `password` or `token`. It is a safety net, not a secret scanner for
  the repository.
- Pull request rules belong in CI: `lint-intents` and the `agent-review` workflow with
  [check-work](/skills/check-work) in `ci` mode.
