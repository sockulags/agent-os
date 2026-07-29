---
name: init-agent-os
description: Sets up agent-os globally on a machine, or initializes a repo's living project policy through an interview. User-invoked only, at machine setup or when onboarding a repo. Not for ordinary tasks.
disable-model-invocation: true
---

# init-agent-os

Two explicit modes. Both end the same way: show the exact diff, wait for approval, only then write. Never mix the modes in one run.

## Mode: `global` (once per machine)

Invoked as `init-agent-os global`.

1. Verify the plugin is visible on this platform (skills listed under the `agent-os` namespace). Report what you find.
2. Run `scripts/policy-block.ps1 -Check` and report drift between `policy.md` and the managed blocks in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`.
3. Show the resulting block content as a diff against each target file.
4. On approval, run `scripts/policy-block.ps1` to apply. The script is the only writer — never edit the blocks by hand, so block handling stays deterministic.

## Mode: repo init (default)

Invoked in a repo working directory.

1. Read the repo first: existing `CLAUDE.md`/`AGENTS.md`, README, package/build files, CI config. Do not ask about anything the repo already answers.
2. Interview the user one decision at a time, with a recommendation each time:
   - **Merge policy** — may agents merge? Under what conditions (green CI, review)? No answer recorded means no agent ever merges.
   - **Verify commands** — the exact commands that prove the project works (test, build, lint, run).
   - **Design system** — where tokens/components live, for the frontend mockup step.
   - **Planning surface** — tracker or local folders; map and decision-ticket representation; type
     labels; blocking, claiming, spawned-issue links, and branch graduation.
   - **Branch/PR flow** — target branch, PR conventions, who reviews.
   - **Batch execution** — maximum mutating concurrency while reserving review capacity; worktree
     and branch convention; retry limit; integration strategy; whether operational manifests are
     tracked; cleanup authority.
   - **Conventions and gotchas** worth recording now.
3. Draft the project policy section (seeded from the Preferences section of global `policy.md`), show it as a diff against the repo's policy file (`CLAUDE.md`/`AGENTS.md`, or a new `policy.md` if the repo has neither).
4. On approval, write it. The project policy is a living document — `deliver-work` will propose additions over time.

## Hard rules

- Never write any file before the user has approved the shown diff — approval is the entire point of this skill.
- Block handling follows `policy-block.ps1` semantics: add exactly one block when missing, update only inside well-formed markers, abort without mutation on duplicated or malformed markers, never touch text outside the block.
- If project policy has no explicit merge policy, record nothing that permits merging — absence means forbidden.
- One repo per run, and global mode touches no repo files — mixing targets makes the shown diff unreviewable, and the diff is what the user approves.
