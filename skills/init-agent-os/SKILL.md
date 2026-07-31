---
name: init-agent-os
description: Sets up agent-os globally on a machine, or initializes a repo's living project policy through an interview. User-invoked only, at machine setup or when onboarding a repo. Not for ordinary tasks.
disable-model-invocation: true
---

# init-agent-os

The invocation authorizes setup writes for the named target. Use one mode per run.

## Mode: `global` (once per machine)

Invoked as `init-agent-os global`.

1. Verify the plugin is visible on this platform (skills listed under the `agent-os` namespace). Report what you find.
2. Run `scripts/policy-block.ps1 -Check` and report drift between `policy.md` and the managed blocks in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`.
3. Run `scripts/policy-block.ps1` to apply the managed blocks and show the resulting diff. The script
   is the only writer.

## Mode: repo init (default)

Invoked in a repo working directory.

1. Read the repo first: existing `CLAUDE.md`/`AGENTS.md`, README, package/build files, CI config. Do not ask about anything the repo already answers.
2. Ask only about material facts the repository does not answer, with a recommendation:
   - **Delivery defaults** — branch, PR, merge, and deploy conventions.
   - **Verify commands** — the exact commands that prove the project works (test, build, lint, run).
   - **Design system** — where tokens and components live.
   - **Planning surface** — tracker or local folders, decision-ticket conventions, and
     implementation-issue readiness states or labels.
   - **Batch execution** — concurrency, worktree naming, retries, and integration strategy.
   - **Conventions and gotchas** worth recording now.
3. Write the smallest useful policy section to the repo's existing instruction file, or a new
   `policy.md` when none exists, and show the resulting diff.

Block handling remains deterministic: add one missing block, update only well-formed managed content,
and stop on duplicate or malformed markers. Global mode touches no repository files; repo mode
touches one repository. The direct request or recorded delivery defaults govern merge and deploy
actions.
