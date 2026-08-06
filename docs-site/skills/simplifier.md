---
title: simplifier
description: Remove unnecessary code and solution layers without turning readable code into code golf.
skill-description: Simplifies an existing implementation or diff by removing unnecessary code, abstractions, dependencies, and solution layers while preserving required behavior. Use manually when the developer asks to simplify, reduce code, remove over-engineering, or find a more direct solution. Not for code golf, speculative rewrites, initial feature design, or changing product behavior.
summary: Remove unnecessary code and solution layers
---

# simplifier

**Bucket:** workflow · **Invocation:** manual

Simplifies an existing implementation or diff while preserving its required behavior.

It works from deletion outward: remove unused behavior, reuse project code, prefer standard or
native capabilities, collapse unjustified layers, and only then shorten the remaining code. Fewer
lines are useful when they reflect fewer concepts to maintain, not when they make the code denser.

The skill preserves public contracts, trust-boundary validation, security, accessibility, data-loss
protection, justified performance, and useful behavioral tests. If the existing solution is already
simple, it leaves it alone.
