# init-agent-os

**Bucket:** workflow · **Invocation:** manual · `/agent-os:init-agent-os` or `$init-agent-os`

Sets up agent-os globally on a machine, or initializes a repository's living project policy through
an interview. Two explicit modes that never mix in one run. Both end the same way: show the exact
diff, wait for approval, only then write.

## Mode: `global`

Invoked as `init-agent-os global`, once per machine.

1. Verify the plugin is visible on this platform — skills listed under the `agent-os` namespace — and
   report what was found.
2. Run `scripts/policy-block.ps1 -Check` and report drift between `policy.md` and the managed blocks
   in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`.
3. Show the resulting block content as a diff against each target file.
4. On approval, run `scripts/policy-block.ps1` to apply.

The script is the only writer. Editing inside the markers by hand puts the machine into a state the
script's drift check cannot explain. See [Global policy](/guide/global-policy) for the block
semantics and exit codes.

## Mode: repo init

The default, invoked in a repository working directory.

1. Read the repo first — existing `CLAUDE.md` or `AGENTS.md`, README, package and build files, CI
   configuration. Do not ask about anything the repo already answers.
2. Interview one decision at a time, with a recommendation each time, covering merge policy, verify
   commands, design system, planning surface, branch and PR flow, batch concurrency/worktree/retry/
   integration/state/cleanup rules, and the conventions and gotchas worth recording now.
3. Draft the project policy section, seeded from the Preferences section of the global `policy.md`,
   and show it as a diff against the repo's policy file — `CLAUDE.md`, `AGENTS.md`, or a new
   `policy.md` when the repo has neither.
4. On approval, write it.

The full field list is in [Project policy](/guide/project-policy).

## Hard rules

Nothing is written before the user has approved the shown diff, because approval is the entire point
of this skill.

Block handling follows `policy-block.ps1` semantics: add exactly one block when missing, update only
inside well-formed markers, abort without mutation on duplicated or malformed markers, never touch
text outside the block.

If a project policy has no explicit merge policy, nothing that permits merging gets recorded —
absence means forbidden.

One repository per run, and global mode touches no repository files, because mixing targets makes the
shown diff unreviewable and the diff is what the user approves.
