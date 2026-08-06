---
name: simplifier
description: Simplifies an existing implementation or diff by removing unnecessary code, abstractions, dependencies, and solution layers while preserving required behavior. Use manually when the developer asks to simplify, reduce code, remove over-engineering, or find a more direct solution. Not for code golf, speculative rewrites, initial feature design, or changing product behavior.
disable-model-invocation: true
---

# Simplifier

Make the solution smaller in concepts and code without making it harder to understand.

Read the request, affected code, project conventions, current diff, and relevant checks. Establish
the required behavior before editing. Then simplify in this order:

1. Delete code, options, branches, configuration, and files that serve no current requirement.
2. Reuse an existing project helper or pattern instead of maintaining a duplicate.
3. Prefer the standard library, native platform behavior, or an already-installed dependency over
   custom machinery.
4. Collapse wrappers, layers, and abstractions that add indirection without a second real use.
5. Express the remaining behavior directly and readably.

Reduce lines when deletion reflects a simpler solution. Do not compress readable code into dense
expressions merely to lower the line count. A clear loop can be simpler than a clever one-liner.

Preserve required behavior, public contracts, validation at trust boundaries, security,
accessibility, error handling that prevents data loss, and justified performance characteristics.
Keep tests that protect behavior; remove only tests for behavior that no longer exists or tests
that duplicate the same signal without value.

Stay inside the requested surface. Do not turn a focused simplification into an architectural
rewrite or introduce a new dependency to save a few lines.

After editing, inspect the final diff and run the smallest relevant checks. Report what was removed
or made more direct, the verification result, and any complexity that remains because it serves a
real requirement. If the implementation is already simple, leave it unchanged and say so.
