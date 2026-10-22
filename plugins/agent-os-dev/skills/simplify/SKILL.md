---
name: simplify
description: Finds or removes unnecessary code, abstractions, dependencies, and solution layers while preserving required behavior, in one of three modes, review a diff, audit a repository, or apply. check-work and deliver-work use its review mode as their simplification lens. Use manually when the developer asks to simplify, review a diff for over-engineering, audit a repository for deletion candidates, or find a more direct solution. Not for code golf, speculative rewrites, initial feature design, changing product behavior, or a general correctness, security, or performance audit.
disable-model-invocation: true
---

# Simplify

Make the solution smaller in concepts and code without making it harder to understand.

## Choose the mode

- **`simplify review`** reads the current diff and reports findings without changing files. This is
  the lens `check-work` and `deliver-work` apply.
- **`simplify audit`** reads the whole repository and reports its strongest opportunities without
  changing files.
- **`simplify apply`** edits an existing implementation or diff. An explicit request to simplify,
  reduce code, or remove over-engineering in named code is apply mode.

When the request does not say whether files may change, use review mode for a diff and audit mode
for a repository, and report findings first.

## What counts as unnecessary

Look for:

- code, branches, configuration, options, files, or dependencies with no current requirement;
- duplicated behavior already provided by the project;
- custom machinery covered by the standard library, native platform behavior, or an installed
  dependency;
- wrappers, layers, factories, and abstractions without a current responsibility or requirement;
- indirect or dense code that has a more direct, readable form.

Preserve required behavior, public contracts, validation at trust boundaries, security,
accessibility, error handling that prevents data loss, justified performance characteristics, and
tests that protect real behavior. Preserve a cohesive named responsibility even with one caller.
Do not recommend code golf: a clear loop can be simpler than a clever one-liner, and fewer lines is
a result of a simpler solution, never the goal.

## Review mode

Read the request, diff, affected code, project conventions, and relevant checks. Apply the
[finding calibration](../check-work/references/findings.md): require a concrete benefit from a
replacement, and do not turn a reasonable alternative into a required correction.

When [`quality-ratchet`](../quality-ratchet/SKILL.md) evidence is available, consume it before
forming findings. Read the diff and implementation yourself: added, changed, and deleted files,
NLOC, legacy before and after, dependency deltas, complexity deltas, and unavailable optional
analyzers are evidence, not an oracle or threshold. Start with the functions whose complexity rose
most, and judge whether the added paths are required behavior. Report at most one materially
constraining adjacent opportunity and leave unrelated debt to `scope-guard`.

For each supported finding, name the location, the unnecessary complexity, and the simpler
replacement. Rank material deletions and dependency removals first. Do not invent a line-savings
total. If there is nothing worth changing, report `No simplification findings.` This review
complements correctness, security, and scope review and never replaces them.

## Audit mode

Start with deterministic evidence. Resolve `scripts/audit-evidence.mjs` relative to this loaded
`SKILL.md` and run it with Node from the repository root. It ranks the most complex functions
(lizard), duplicated blocks (jscpd), and unused code (knip for JavaScript and TypeScript, vulture
for Python) when those tools are installed, and reports each missing tool as unavailable. Do not
install them. The output is a candidate list that tells you where to read, not a list of findings.

Inspect the project structure, dependencies, conventions, representative flows, and the usages of
each candidate before reporting it. Prefer a short ranked list of high-confidence findings over a
large speculative inventory. For each finding, name the location, the evidence that the complexity
is unnecessary, the simpler replacement, and any behavior or migration constraint that must be
preserved. If the repository is already simple, say so.

## Apply mode

Read the request, affected code, project conventions, current diff, and relevant checks. Establish
the required behavior before editing. Then simplify in this order:

1. Delete code, options, branches, configuration, and files that serve no current requirement.
2. Reuse an existing project helper or pattern instead of maintaining a duplicate.
3. Prefer the standard library, native platform behavior, or an already-installed dependency over
   custom machinery.
4. Collapse wrappers, layers, and abstractions that add indirection without a current
   responsibility or requirement.
5. Express the remaining behavior directly and readably.

Stay inside the requested surface. Do not turn a focused simplification into an architectural
rewrite or introduce a new dependency to save a few lines. Keep tests that protect behavior; remove
only tests for behavior that no longer exists or tests that duplicate the same signal without value.

After editing, inspect the final diff and run the smallest relevant checks. Report what was removed
or made more direct, the verification result, and any complexity that remains because it serves a
real requirement. If the implementation is already simple, leave it unchanged and say so.
