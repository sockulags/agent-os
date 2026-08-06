---
title: simplifier-audit
description: Audit a repository for unnecessary code and solution layers without applying fixes.
skill-description: Audits an entire repository for unnecessary code, abstractions, dependencies, and solution layers while leaving files unchanged. Use manually when the developer asks for a simplification audit, over-engineering audit, deletion candidates, or a repo-wide search for simpler solutions. Not for applying fixes, code golf, or a general correctness, security, or performance audit.
summary: Audit a repository for simplification opportunities
---

# simplifier-audit

**Bucket:** workflow · **Invocation:** manual

Scans the whole repository for high-confidence opportunities to own less code, fewer dependencies,
and fewer solution layers. Each finding includes evidence, a simpler replacement, and constraints
that must be preserved.

The audit is read-only. Use `simplifier` separately when the developer wants findings applied.
