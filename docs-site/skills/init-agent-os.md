---
title: init-agent-os
description: Install shared agent-os policy or initialize one repository's living defaults.
skill-description: Sets up agent-os globally on a machine with personal preferences, or initializes and later adjusts a repo's living project policy through an interview. User-invoked only, at machine setup, when onboarding a repo, or when changing how a repo works. Not for ordinary tasks.
summary: Managed policy setup or repository defaults
---

# init-agent-os

**Bucket:** workflow · **Invocation:** manual · `/init-agent-os` (direct Claude), `/agent-os-dev:init-agent-os` (Claude plugin), or `$init-agent-os` (Codex)

Sets up managed global policy or seeds one repository's project policy.

`global` verifies plugin visibility, checks drift, and applies the managed policy blocks through the
deterministic script. The explicit invocation authorizes those setup writes. Each block starts with
an `<!-- agent-os version X -->` line, so `npx @sockulags/agent-os@latest doctor` can show which
release wrote it. It then settles your personal preferences in a `## My working preferences` section
outside the managed block: whether the agent asks early or decides and reports, how much it explains,
and anything it should always or never do. On a later run it shows them and asks what to change.
They are style only, yield to project policy, and never grant merge, deploy, or external authority.

Repository mode separates facts from preferences. A first run closes with how the agent will work
in the repository and one recommended first action, after asking the working agreement in at most
two rounds: who works here and approves, the default stopping point, the default path for a new
feature, where units live, the language of artifacts, and, for frontend work, when interfaces are
sketched (before delivery, after it, asked each time, or never), in which medium, and where the sketches live. Evidence can recommend an answer but never settles a preference. "Use your
recommendations for the rest" is always available and holds for the whole run: a fact with no
evidence goes under **Open setup questions** without being asked. In a repository with no policy
surface it writes `policy.md` plus a `CLAUDE.md` and an `AGENTS.md` that make the hosts load it.

A return run starts when the repository already has a `## Working agreement` or an `.agent-os/`
directory. It never repeats the interview. It summarizes what is set today, flags drift between
policy and repository and anything the policy does not cover yet, and asks what you want to change.
It writes only the areas you choose; "nothing" writes nothing.

For facts, repository mode inspects instruction and policy surfaces, project docs, build and
test configuration, CI, and evidence of conditional concerns before asking anything. Before writing,
every live host-consumed policy surface has unambiguous ownership and precedence; shared identical
content or a clear canonical cross-reference is sufficient, while leaving conflicting applicable
rules elsewhere is forbidden. If target ownership cannot be resolved, it asks one ownership
question and blocks the write. A transient completeness ledger ensures every applicable material
field reaches evidenced or confirmed, `N/A`, explicitly deferred/open, or conflicting. It asks only
unresolved material questions, one at a time, with a recommendation and consequence. The mandatory
core is policy ownership, delivery and external-effect boundaries, verification and ground truth,
coherent planning identities/claims/handoffs/readiness/dependencies, epic ownership, and durable
lesson maintenance. Frontend/rendered QA,
package/release/docs, CI/deploy, auth/security/billing, database/migration/concurrency,
batch/monorepo, and native/desktop sections activate only when repository evidence supports them.

Each core field reaches one allowed terminal state before writing. Explicit deferrals are recorded
concisely under **Open setup questions** without guessing; only an unresolved policy
ownership/write-target conflict blocks the write. The written policy contains only durable
behavior-changing defaults and relevant sections; it omits inactive modules, N/A fields, the ledger,
and interview history, preserves unrelated instructions, and shows all changed policy surfaces in
the resulting diff. The invocation itself authorizes this setup write.

Besides the policy, repository mode writes these files when they are absent and shows each in the
diff:

- `.agent-os/guards.json` with protected paths found by inspection, the default frozen intent and
  spec globs, and `secretScan: true` ([Guard hooks](/reference/guards));
- `.agent-os/quality.json` with the main test command as a `required` check, which the developer
  trusts once with quality-ratchet's `trust` command;
- `REVIEW.md`, the repository's review policy for [check-work](/skills/check-work);
- for GitHub Actions repositories, the `lint-intents` and `agent-review` workflows.

The planning field now covers where intents live, whether units live in `plan.md` or a tracker,
and, with a tracker, a `## Tracker mandate` section. A `CODEOWNERS` entry for intents and specs is
proposed but not written, because it changes who must review other people's work.

Managed block edits remain script-owned and stop on duplicate or malformed markers. The global mode
installs the policy's development section because this skill ships in agent-os-dev.
