---
title: Project policy
description: Record repository-specific commands, boundaries, conventions, and delivery defaults.
---

# Project policy

Project policy holds repository-specific facts that should not be hardcoded into reusable skills.
It lives in the repo's existing `CLAUDE.md`, `AGENTS.md`, or a small `policy.md`.

Record only useful defaults:

- verification and acceptance commands;
- branch, PR, merge, and deploy conventions;
- design-system locations;
- planning surface, decision-ticket conventions, and implementation-issue readiness states or labels;
- batch concurrency, worktree naming, retries, and integration strategy;
- conventions, gotchas, and durable lessons.

The direct request has higher authority than defaults. A policy can grant standing delivery
behavior; absence does not imply permission for merge, deploy, destructive cleanup, or external
effects.

`init-agent-os` reads the repository first, asks only about missing material facts, writes the
smallest useful policy, and shows the resulting diff. The invocation itself authorizes that setup
write.

Keep the policy alive by updating facts that repeatedly affect work. Do not turn one-off preferences
or speculative guardrails into permanent process.
