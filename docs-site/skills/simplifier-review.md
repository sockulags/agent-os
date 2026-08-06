---
title: simplifier-review
description: Review the current diff for unnecessary code and solution layers.
skill-description: Reviews the current implementation diff for unnecessary code, abstractions, dependencies, and solution layers without changing files. It activates during code review, including deliver-work review, when the candidate should be checked for a simpler solution. It skips whole-repository audits, initial design, code golf, and correctness or security review outside complexity caused by the diff.
summary: Review a diff for unnecessary complexity
---

# simplifier-review

**Bucket:** discipline · **Invocation:** automatic

Adds a simplification lens to code review. It finds unnecessary additions, duplicated project code,
avoidable dependencies, custom versions of standard or native behavior, and layers without real
variation.

It is read-only and reports only actionable findings with a concrete simpler replacement. It does
not reward code golf and does not replace correctness, security, or scope review.
