---
title: simplify
description: Find or remove unnecessary code, abstractions, dependencies, and solution layers in review, audit, or apply mode.
skill-description: Finds or removes unnecessary code, abstractions, dependencies, and solution layers while preserving required behavior, in one of three modes, review a diff, audit a repository, or apply. check-work and deliver-work use its review mode as their simplification lens. Use manually when the developer asks to simplify, review a diff for over-engineering, audit a repository for deletion candidates, or find a more direct solution. Not for code golf, speculative rewrites, initial feature design, changing product behavior, or a general correctness, security, or performance audit.
summary: Review, audit, or remove unnecessary code and solution layers
---

# simplify

**Bucket:** workflow · **Invocation:** manual · `/simplify` (direct Claude), `/agent-os-dev:simplify` (Claude plugin), or `$simplify` (Codex)

Makes the solution smaller in concepts and code without making it harder to understand. It replaces
the former `simplifier`, `simplifier-review`, and `simplifier-audit`, which had nearly identical
lists of what counts as unnecessary.

## Modes

| Mode | Reads | Changes files |
|---|---|---|
| `simplify review` | the current diff | no |
| `simplify audit` | the whole repository | no |
| `simplify apply` | named code or a diff | yes |

When a request does not say whether files may change, the skill uses review mode for a diff and
audit mode for a repository, and reports findings first. [check-work](/skills/check-work) and
[deliver-work](/skills/deliver-work) apply review mode as their simplification lens.

## What counts as unnecessary

Code, options, configuration, files, or dependencies with no current requirement; behavior the
project already provides; custom machinery that the standard library, the platform, or an installed
dependency covers; layers and abstractions without a current responsibility; and indirect or dense
code with a more direct form. Required behavior, public contracts, trust-boundary validation,
security, accessibility, data-loss protection, justified performance, and tests that protect real
behavior stay. Fewer lines is a result of a simpler solution, never the goal.

Review mode consumes [quality-ratchet](/skills/quality-ratchet) evidence when it exists. Audit mode
first runs the bundled `scripts/audit-evidence.mjs`, which ranks complex functions, duplicated
blocks, and unused code when lizard, jscpd, knip, or vulture are installed, and treats the output as
a list of places to read, not as findings. Apply mode deletes first, then reuses, then prefers
platform behavior, then collapses layers, and finally rewrites what remains directly, followed by
the smallest relevant checks.
