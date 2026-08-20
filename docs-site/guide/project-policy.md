---
title: Project policy
description: Record repository-specific commands, boundaries, conventions, and delivery defaults.
---

# Project policy

Project policy holds repository-specific facts that should not be hardcoded into reusable skills.
It lives in the repo's existing `CLAUDE.md`, `AGENTS.md`, or a small `policy.md`.

`init-agent-os` inspects the repository before asking questions. Before writing, every live
host-consumed policy surface must have unambiguous ownership and precedence. Shared identical content
or a clear canonical cross-reference is sufficient; duplication is not required. Selecting one file
while conflicting applicable rules remain elsewhere is forbidden. If ownership or the write target
cannot be resolved, the agent asks one ownership question and blocks the write.

It keeps completeness internal so the written policy remains sparse: every applicable material fact
reaches one terminal state—evidenced or confirmed, `N/A`, explicitly deferred/open, or conflicting.
Silence is not a default. Only an unresolved policy ownership/write-target conflict blocks writing;
other explicitly deferred fields may be recorded concisely under **Open setup questions**.

Record only durable behavior-changing defaults:

- canonical policy ownership and instruction surfaces;
- delivery boundary, stopping point, and external-effect conventions;
- verification commands and ground truth, including manual checks when commands are insufficient;
- planning surface, stable identities, dependencies, and readiness states or labels;
- maintenance location for durable lessons and gotchas;
- only conditional sections supported by repository evidence: frontend/rendered QA,
  package/release/docs, CI/deploy, auth/security/billing/external writes,
  database/migration/concurrency, batch/monorepo, and native/desktop.

The direct request has higher authority than defaults. A policy can grant standing delivery
behavior; absence does not imply permission for merge, deploy, destructive cleanup, or external
effects.

`init-agent-os` asks one unresolved material question at a time, with a recommendation and
consequence, and records explicit deferrals under **Open setup questions**. It does not write
`N/A` fields, interview history, or the completeness ledger. It writes the smallest useful policy,
preserves unrelated instructions, and shows all changed policy surfaces in the resulting diff; the
invocation itself authorizes that setup write.

Keep the policy alive by updating facts that repeatedly affect work. Do not turn one-off preferences
or speculative guardrails into permanent process.
