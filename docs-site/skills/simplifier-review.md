---
title: simplifier-review
description: Review the current diff for unnecessary code and solution layers.
skill-description: Reviews the current implementation diff for unnecessary code, abstractions, dependencies, and solution layers without changing files. check-work and deliver-work apply it as their simplification lens. Use manually when the developer asks only for a simplification review of a diff. Not for whole-repository audits, initial design, code golf, or correctness and security review.
summary: Review a diff for unnecessary complexity
---

# simplifier-review

**Bucket:** workflow · **Invocation:** manual

Adds a simplification lens to code review. [check-work](/skills/check-work) and
[deliver-work](/skills/deliver-work) apply it during every review, so it is manual on its own and
does not compete with check-work for review requests. It finds unnecessary additions, duplicated project code,
avoidable dependencies, custom versions of standard or native behavior, and layers without real
variation.

It is read-only and reports only actionable findings with a concrete simpler replacement. It does
not reward code golf and does not replace correctness, security, or scope review.

When [quality-ratchet](/skills/quality-ratchet) has produced evidence, use it as context before
forming findings. Its complexity deltas point to the functions whose number of paths rose most; start
there. Read the diff and code yourself: file, NLOC, legacy, dependency, complexity, and analyzer
signals are not threshold gates. Preserve abstractions justified by multiple providers, runtime
selection, compatibility, or trust boundaries, and leave unrelated debt to `scope-guard`.

Preserve cohesive responsibilities even with one caller. Apply the shared finding calibration in
[check-work](/skills/check-work#finding-disposition): a simpler replacement must have a concrete
benefit. An equally valid design preference is not a required correction.
