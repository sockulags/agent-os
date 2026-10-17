---
name: simplifier-audit
description: Audits an entire repository for unnecessary code, abstractions, dependencies, and solution layers while leaving files unchanged. Use manually when the developer asks for a simplification audit, over-engineering audit, deletion candidates, or a repo-wide search for simpler solutions. Not for applying fixes, code golf, or a general correctness, security, or performance audit.
disable-model-invocation: true
---

# Audit for simplification

Find the repository's strongest opportunities to own less code and fewer solution layers without
changing required behavior.

Start with deterministic evidence. Resolve `scripts/audit-evidence.mjs` relative to this loaded
`SKILL.md` and run it with Node from the repository root. It ranks the most complex functions
(lizard), duplicated blocks (jscpd), and unused code (knip for JavaScript and TypeScript, vulture for
Python) when those tools are installed, and reports each missing tool as unavailable. Do not install
them. Use the output to decide where to read; dead code and duplication found by a tool need a usage
check, not a repository-wide read. The tool output is a candidate list, not findings.

Inspect the project structure, dependencies, conventions, representative flows, and usages of each
candidate before reporting it. Look for:

- dead or speculative behavior that no current requirement or caller uses;
- duplicate helpers and parallel implementations;
- custom code replaced by the standard library, native platform behavior, or an installed
  dependency;
- wrappers, factories, layers, configuration, and abstractions without a current responsibility or requirement;
- dependencies used for behavior the project or platform already provides.

Prefer a short ranked list of high-confidence findings over a large speculative inventory. For each
finding, name the location, evidence that the complexity is unnecessary, the simpler replacement,
and any behavior or migration constraint that must be preserved. Do not estimate saved lines unless
the deletion is directly countable.

Preserve cohesive responsibilities and protected invariants even with one caller.

Do not apply fixes. Do not treat required validation, security, accessibility, data-loss protection,
justified performance, or useful tests as bloat. If the repository is already simple, say so.
