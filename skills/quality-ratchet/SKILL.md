---
name: quality-ratchet
description: Keeps implementation quality from regressing by comparing a candidate with its exact entry state and separating bounded touched-surface improvement from cleanup. It activates during implementation and delivery review, not for repository-wide debt hunts or line-count optimization.
---

# Quality ratchet

Keep the smallest set of concepts and machinery needed for the current change. The ratchet is an
evidence layer, not a score, gate, or replacement for semantic review.

Resolve `scripts/quality-delta.mjs` relative to this loaded `SKILL.md`; do not assume the current
worktree contains an Agent OS checkout. Before the first mutation in a Git worktree, run that
installed runner with `begin` when it is available. It records the exact tracked and nonignored
untracked entry state without stashing or changing user files. After implementation and before
`simplifier-review`, run the same runner with `check` and pass its evidence to that review. Use its
`clear` command only when abandoning the attempt. The normal correctness, security, scope,
independent-review, and verification steps still decide delivery.

Use three zones:

1. A bounded, behavior-preserving improvement on the implementation surface already being
   touched is allowed when it makes the requested change clearer or safer.
2. Report at most one concrete adjacent structural opportunity when it materially constrains the
   requested change, but leave it out of the patch unless the boundary expands.
3. Ignore unrelated debt. `scope-guard` owns drift; do not turn a ratchet signal into a cleanup
   project.

The check reports added, changed, and deleted source files, touched-source NLOC before/after, the
before/after status of source paths that were already present at entry, package dependency deltas,
and optional analyzer capability. Raw file, function, or line counts are signals only. There is no
aggregate score and no threshold gate. Missing Lizard or jscpd is reported as unavailable rather
than clean; the core Node evidence remains usable. Their parsing integration is an explicit
follow-up, not an install-time prerequisite.

The Stop hook blocks only an active lifecycle violation: no baseline, a corrupt baseline, or a
missing/stale check for the current candidate. A worktree without an active baseline is a cheap
no-op. A re-entered Stop hook never loops by blocking again. Run `clear` deliberately when abandoning
an implementation attempt; uninstall is not currently a command.

Exit with the smallest complete implementation, the quality evidence, semantic review findings,
and fresh verification. Do not remove a legitimate abstraction merely because it increases a raw
count: multiple providers, runtime selection, compatibility, or a real trust boundary can justify
the machinery and belongs to semantic judgment.
