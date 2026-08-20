---
title: init-agent-os
description: Install shared agent-os policy or initialize one repository's living defaults.
skill-description: Sets up agent-os globally on a machine, or initializes a repo's living project policy through an interview. User-invoked only, at machine setup or when onboarding a repo. Not for ordinary tasks.
summary: Managed policy setup or repository defaults
---

# init-agent-os

**Bucket:** workflow · **Invocation:** manual · `/init-agent-os` (direct Claude), `/agent-os:init-agent-os` (Claude plugin), or `$init-agent-os` (Codex)

Sets up managed global policy or seeds one repository's project policy.

`global` verifies plugin visibility, checks drift, and applies the managed policy blocks through the
deterministic script. The explicit invocation authorizes those setup writes.

Repository mode is facts-first: it inspects instruction and policy surfaces, project docs, build and
test configuration, CI, and evidence of conditional concerns before asking anything. Before writing,
every live host-consumed policy surface has unambiguous ownership and precedence; shared identical
content or a clear canonical cross-reference is sufficient, while leaving conflicting applicable
rules elsewhere is forbidden. If target ownership cannot be resolved, it asks one ownership
question and blocks the write. A transient completeness ledger ensures every applicable material
field reaches evidenced or confirmed, `N/A`, explicitly deferred/open, or conflicting. It asks only
unresolved material questions, one at a time, with a recommendation and consequence. The mandatory
core is policy ownership, delivery and external-effect boundaries, verification and ground truth, planning
identities/readiness/dependencies, and durable lesson maintenance. Frontend/rendered QA,
package/release/docs, CI/deploy, auth/security/billing, database/migration/concurrency,
batch/monorepo, and native/desktop sections activate only when repository evidence supports them.

Each core field reaches one allowed terminal state before writing. Explicit deferrals are recorded
concisely under **Open setup questions** without guessing; only an unresolved policy
ownership/write-target conflict blocks the write. The written policy contains only durable
behavior-changing defaults and relevant sections; it omits inactive modules, N/A fields, the ledger,
and interview history, preserves unrelated instructions, and shows all changed policy surfaces in
the resulting diff. The invocation itself authorizes this setup write.

Managed block edits remain script-owned and stop on duplicate or malformed markers.
