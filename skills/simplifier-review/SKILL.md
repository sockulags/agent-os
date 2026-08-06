---
name: simplifier-review
description: Reviews the current implementation diff for unnecessary code, abstractions, dependencies, and solution layers without changing files. It activates during code review, including deliver-work review, when the candidate should be checked for a simpler solution. It skips whole-repository audits, initial design, code golf, and correctness or security review outside complexity caused by the diff.
---

# Review for simplification

Find concrete ways to make the current diff smaller in concepts and code while preserving its
required behavior.

Read the request, diff, affected code, project conventions, and relevant checks. Look for:

- code, branches, configuration, options, files, or dependencies with no current requirement;
- duplicated behavior already provided by the project;
- custom machinery covered by the standard library, native platform behavior, or an installed
  dependency;
- wrappers, layers, factories, and abstractions without a second real use;
- indirect or dense code that has a more direct, readable form.

Do not recommend code golf. Do not remove required behavior, public contracts, trust-boundary
validation, security, accessibility, data-loss protection, justified performance, or tests that
protect real behavior.

Report only supported, actionable findings. For each, name the location, unnecessary complexity,
and simpler replacement. Rank material deletions and dependency removals first. Do not invent a
line-savings total. If there is nothing worth changing, report `No simplification findings.`

This review is read-only and complements correctness, security, and scope review; it never replaces
them.
