---
name: quality-ratchet
description: Quality ratchet for code you are implementing or about to deliver, so the touched code ends up in the shape the change needs and no worse than it was. Decides that shape before the first edit instead of repeating the existing pattern, records the entry state, compares the candidate with it, and keeps cleanup bounded to the code the change touches. Use when adding a feature or changing existing code, when reviewing your own implementation or candidate before delivery, and when the user says things like don't make it worse, keep it at least as clean as it is now, no quality regressions compared with main, tidy it up while you're there but only what you touch, check the candidate, or this has too many layers. Not for repository-wide tech-debt hunts, reviewing someone else's pull request, or cutting line counts.
---

# Quality ratchet

Decide the shape the touched code should have, then keep the smallest set of concepts and machinery
that shape needs. The runner is an evidence layer, not a score or replacement for semantic review.
Explicit project rules may gate delivery.

## Decide the shape first

Before the first edit, find the nearest existing behavior, contract, and tests, and decide the shape
the touched code should have with this change in it. An existing pattern shows what fit when it was
written; it is not a rule to repeat. Ask what you would build if this requirement had been there
from the start:

- When the existing design still fits, extend its owner instead of adding a parallel implementation.
- When it does not, reshape the touched code to the design that fits and move its callers in the
  same change. Do not bolt the new case onto the old design or leave the old path beside the new one.

Remove before you add: delete what the change makes dead, such as the old path, its unused helpers
and options, and tests that protect only the replaced implementation, then build on what is left.
A unit's `Target shape` is this decision already made. Follow it. When the code shows a better shape
inside the same outcome and boundaries, build that one and state the difference and the reason in
the report. Return the unit to `shape-work` only when the shape changes its outcome or boundaries.

The decision covers the code the change touches and the callers it must move. A reshape that needs
more than that is the one adjacent opportunity to report, not part of the patch. For TypeScript,
React, or Java changes, read [references/structure.md](references/structure.md) for contract
ownership and cohesive boundaries. Make this a code decision, not a mandatory planning artifact.

## Comments

A comment that explains the project's own code is a defect in that code. That covers a comment that
says why the code is odd, what it works around, or that it must not be changed, narration of what
the next lines do, commented-out code, and a lint or type suppression whose rule guards correctness
or safety. Add none. In the code the change touches, delete every such comment and fix what it
points at in the same change: reshape or rename until the behavior is obvious, fix the suppressed
error, or encode a `do not change` constraint as a type, test, or lint rule. When that fix reaches
beyond the touched code, still delete the comment, make the smallest fix that fits, and report the
symbol and what remains as an open item. When unsure whether a comment may stay, it goes.

Only these stay: license headers, documentation of a public contract, a link to an issue or
specification for a constraint the code cannot express, a suppression of a rule that is only
stylistic, and a note on behavior that an external dependency, platform, or protocol forces.

## Baseline and check

Resolve `scripts/quality-delta.mjs` relative to this loaded `SKILL.md`; do not assume the current
worktree contains an Agent OS checkout. Before the first mutation in a Git worktree, run that
installed runner with `begin` when it is available. It records the exact tracked and nonignored
untracked entry state without stashing or changing user files. After implementation and before
`simplify`'s review mode, run the same runner with `check` and pass its evidence to that review. At
delivery, run `finish`: it records a fresh check and closes the baseline only when that check passes.
Use its `clear` command only when abandoning the attempt. The normal correctness, security, scope,
independent-review, and verification steps still decide delivery.

## Zones

Use three zones:

1. The shape decision, and a bounded improvement on the implementation surface already being
   touched that makes the requested change clearer or safer, belong in the patch. Behavior the
   request does not change stays the same. A touched test file is
   part of that surface; `proportional-testing` says what it keeps.
2. Report at most one concrete adjacent structural opportunity when it materially constrains the
   requested change, but leave it out of the patch unless the boundary expands.
3. Ignore unrelated debt. `scope-guard` owns drift; do not turn a ratchet signal into a cleanup
   project.

Extract a named responsibility when it makes the touched code easier to understand or protects an
invariant, even with one caller. This is allowed local improvement, not automatic scope expansion.
Do not force inheritance, shared utils, or extra layers merely to reduce file size.

## Evidence

The check reports added, changed, and deleted source files, test files included, touched-source NLOC
before/after, the before/after status of source paths that were already present at entry, package
dependency deltas, and optional analyzer capability. When lizard is installed, it also reports
cyclomatic complexity before and after for touched functions, ranked by increase. That value counts
paths through a function, not readability; it is best effort, can miss functions in unusual
formatting, and has before values only for files that were clean at entry. Raw file, function, line,
or complexity counts are signals only. There is no aggregate score and no threshold gate unless the
project sets one. Missing lizard is reported as unavailable rather than clean; jscpd is detected but
not integrated into the delta. The core Node evidence remains usable without either.

Use existing project checks for enforceable rules and report structural signals as advisory.
When configuring external checks, read [references/project-controls.md](references/project-controls.md).
The runner executes project commands from `.agent-os/quality.json`; required failures block delivery.
It runs them only after the developer has trusted that repository's declared commands on this
machine. Untrusted commands do not run and block delivery: show the listed commands and the `trust`
command to the developer. Never run `trust` yourself, write its trust store, or set `CI` to bypass
it; trust is the developer's decision. Do not rerun unchanged failing checks in a loop. Fix the failure or report the blocker.
Policy changes require an explicit acknowledgement with the already-authorized reason; do not ask
for approval again when the task authorizes the change or clear the baseline to hide it. A
fresh `check` proves evidence freshness, not code quality, passing tests, or completed review. The
runner currently inspects dependencies only in the root `package.json`; do not infer Java or
workspace-package coverage from it. Run relevant configured analyzers outside the model, pass short
actionable deltas to review, and reuse results only while their inputs, configuration, and tool
versions remain unchanged. Do not install analyzers or invent thresholds for an ordinary task.

The Stop hook blocks an active lifecycle violation (a corrupt baseline or missing/stale check),
unacknowledged control-policy changes, or failed explicit project requirements. It checks recorded
results and their inputs without rerunning project commands. State is bound to the current Git worktree and host session: Claude uses
`CLAUDE_CODE_SESSION_ID`, Codex uses `CODEX_THREAD_ID`, and standalone/manual use has a deterministic
fallback. `begin`, `check`, `finish`, and `clear` use those command environments, preferring Codex when both
IDs exist. Stop uses payload
`session_id`, treating a non-empty `turn_id` as Codex and otherwise as Claude; without `session_id`,
it retains the command environment for direct/manual use. A worktree without an active baseline for
the current session is a cheap no-op. Before ending any turn with an active baseline, including a
pause to ask the developer, run `check`; a fresh passing check lets the turn end and keeps the
baseline, so the next turn still compares against the exact entry state. Every Stop block is bounded:
after three re-entered Stops on the same unchanged candidate, the hook allows the stop with a
user-visible message and keeps the baseline active, so `finish` still refuses delivery. Run `clear`
deliberately from the same host session when abandoning an implementation attempt; uninstall is not
currently a command.

## Delivery guards

The same skill directory carries `scripts/guards.mjs`, the runner behind the agent-os-dev guard
hooks. It reads `.agent-os/guards.json`, runs no repository-declared command, and does nothing where
that file is absent:

- **SessionStart** names the intent behind the current branch, its spec revision, and any spec or
  plan whose `built_on` revision is stale.
- **PreToolUse** asks before an edit to a path under `protectedPaths` (Codex has no ask decision
  and blocks it), and blocks edits to accepted intents, specs, and plans under `frozen` while a
  delivery baseline is active and edits to a test locked by `lock-test`. With `secretScan` on, it
  also blocks a `git commit` whose staged diff contains a likely secret.

The delivery Stop gate is this skill's own Stop hook. Declare the ground truth as a `required`
check in `.agent-os/quality.json`: `check` then runs it after the developer has trusted the
repository's controls, and Stop blocks a turn that ends with an edit newer than the last passing
check.

`diagnose-before-fix` runs `guards.mjs lock-test <path>` after committing a failing test and
`unlock-test <path>` once the fix passes. A block is a boundary: change course or ask, and never
reach the same edit through another tool or path.

Exit with the smallest complete implementation of the decided shape, the quality evidence, semantic review findings,
and fresh verification. Do not remove a legitimate abstraction merely because it increases a raw
count: multiple providers, runtime selection, compatibility, or a real trust boundary can justify
the machinery and belongs to semantic judgment.
