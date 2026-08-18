---
name: init-agent-os
description: Sets up agent-os globally on a machine, or initializes a repo's living project policy through an interview. User-invoked only, at machine setup or when onboarding a repo. Not for ordinary tasks.
disable-model-invocation: true
---

# init-agent-os

The invocation authorizes setup writes for the named target. Use one mode per run.

## Mode: `global` (once per machine)

Invoked as `init-agent-os global`.

1. Verify the plugin is visible on this platform (skills listed under the `agent-os` namespace). Report what you find.
2. Run `scripts/policy-block.ps1 -Check` and report drift between `policy.md` and the managed blocks in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`.
3. Run `scripts/policy-block.ps1` to apply the managed blocks and show the resulting diff. This
   deterministic writer shares its marker contract with the npm installer's policy writer.

## Mode: repo init (default)

Invoked in a repo working directory. Read [repository-init.md](references/repository-init.md)
for the detailed contract.

1. Inspect broadly before asking: instruction and policy surfaces, README and docs, package/build
   files, test and CI configuration, and evidence of conditional areas. Before writing, every live
   host-consumed policy surface must have unambiguous ownership and precedence. Shared identical
   content or a clear canonical cross-reference is sufficient; do not select one file while
   conflicting applicable rules remain elsewhere. If target ownership cannot be resolved, ask one
   ownership question and block the write.
2. Maintain a transient completeness ledger while working. Every applicable material field ends as
   repository-evidenced or confirmed, `N/A`, explicitly deferred/open, or conflicting. Do not
   guess through a conflict, and do not write the ledger or interview history to the policy.
3. Before writing, each mandatory core field must reach one allowed terminal state: repository-
   evidenced or confirmed, `N/A`, explicitly deferred/open, or conflicting. The core covers policy
   ownership and canonical instruction surface; delivery boundary, stopping point, and external
   effects; verification and ground truth, including when commands are insufficient; planning
   identities, readiness, and dependencies; and maintenance of durable lessons and gotchas. Only
   an unresolved policy ownership/write-target conflict blocks writing; other explicit deferrals
   may be written concisely under **Open setup questions**.
4. Activate only conditional modules supported by repository evidence: frontend/design/rendered QA;
   package/release/docs; CI/deploy; auth/security/billing/external writes; database/migration/
   concurrency; batch/monorepo; and native/desktop. Omit inactive modules from the output.
5. Ask only unresolved material questions, one at a time, with a recommendation and consequence.
   Explicit deferral is an answer: record it under **Open setup questions** without inventing a
   default. Do not ask feature-specific outcome, acceptance, or UI-product questions.
6. Write only durable behavior-changing defaults and relevant sections to the resolved existing
   instruction surface, or a new `policy.md` when none exists. Preserve unrelated instructions,
   show the resulting diff, and do not request a second approval for this setup write.

Block handling remains deterministic: add one missing block, update only well-formed managed content,
and stop on duplicate or malformed markers. Global mode touches no repository files; repo mode
touches one repository. The direct request or recorded delivery defaults govern merge and deploy
actions.
