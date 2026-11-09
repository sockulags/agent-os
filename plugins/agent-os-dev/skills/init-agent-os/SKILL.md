---
name: init-agent-os
description: Sets up agent-os globally on a machine with personal preferences, or initializes and later adjusts a repo's living project policy through an interview. User-invoked only, at machine setup, when onboarding a repo, or when changing how a repo works. Not for ordinary tasks.
disable-model-invocation: true
---

# init-agent-os

The invocation authorizes setup writes for the named target. Use one mode per run.

## Mode: `global` (once per machine)

Invoked as `init-agent-os global`.

1. Verify the agent-os skills are visible on this platform: under the `agent-os` namespace for a
   plugin install, or as top-level skills for a direct install. Report what you find.
2. Resolve `scripts/policy-block.mjs` relative to this loaded `SKILL.md` and run it with Node and
   `--check`. Report drift between the policy source and the managed blocks. Without
   `--platform`, it targets `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` for the hosts present on
   this machine.
3. Run the same script without `--check` to apply the managed blocks and show the resulting diff.
   The npm installer imports this writer, so both share one marker contract. Each block starts with
   an `<!-- agent-os version X -->` line taken from the installed release.
4. Settle personal preferences in a `## My working preferences` section outside the managed block
   of each target file. When the section is absent, ask three things with a recommendation each:
   when unsure, ask early or decide and report (recommend decide and report for reversible choices);
   explanations short or walked through (recommend short); and anything the agent should always or
   never do. When it exists, show it and ask what to change; "nothing" writes nothing. These are
   style only: they yield to project policy and never grant merge, deploy, or external-effect
   authority.

## Mode: repo init (default)

Invoked in a repo working directory. Read [repository-init.md](references/repository-init.md)
for the detailed contract.

Facts and preferences are collected differently. Facts, such as commands, paths, and CI, come from
the repository. Preferences, how the developer wants to work here, can only come from the developer:
evidence may recommend an answer but does not settle one. Repo init never asks or writes the personal
preferences that belong to global mode.

Use the first run when the repository has neither a `## Working agreement` section nor an
`.agent-os/` directory. Otherwise use the return run.

### Working agreement

These are the preferences a repository records, under `## Working agreement` in its policy:

- who works here and who approves: solo, or a team and its reviewer;
- the default stopping point: local change, pull request, merge, or deployment;
- the default path for a new feature: deliver directly, spec first, or intent, spec, and plan;
- where delivery units live: `plan.md` or a tracker;
- the language of commits, docs, and issues;
- with the frontend module active, when interfaces are sketched (before delivery, after it, asked
  each time, or never) and, unless never, in which medium and where the sketches live,
  recommending asking each time, a workshop the repository already has, and `html` otherwise.

Ask them in at most two rounds of at most four questions, through the host's structured question
tool when it has one. Each question leads with its recommended answer and states the consequence of
choosing differently. "Use your recommendations for the rest" is always an available answer and
holds for the whole run: an evidence-backed recommendation counts as confirmed, including on later
fact questions, and a fact with no evidence goes under **Open setup questions** without being asked.
An answer that settles a core field is written once.

### First run

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
    effects; verification and ground truth, including when commands are insufficient; coherent
    planning identities, claims, handoffs, readiness, epic ownership, and dependencies; and
    maintenance of durable lessons and gotchas. Only
   an unresolved policy ownership/write-target conflict blocks writing; other explicit deferrals
   may be written concisely under **Open setup questions**.
4. Activate only conditional modules supported by repository evidence: frontend/design/rendered QA;
   package/release/docs; CI/deploy; auth/security/billing/external writes; database/migration/
   concurrency; batch/monorepo; and native/desktop. Omit inactive modules from the output.
5. Before the first question, say in a few plain lines what you found and what you are about to ask.
   Ask the working agreement. Then ask only unresolved material fact questions, one at a time, with
   a recommendation and consequence. Explicit deferral is an answer: record it under **Open setup
   questions** without inventing a default. Do not ask feature-specific outcome, acceptance, or
   UI-product questions.
6. Write only durable behavior-changing defaults and relevant sections to the resolved existing
   instruction surface. When none exists, write a new `policy.md`, plus a `CLAUDE.md` holding
   `@policy.md` and an `AGENTS.md` that says to read it, so the hosts load it. Preserve unrelated
   instructions, show the resulting diff, and do not request a second approval for this setup write.
7. Write the Agent OS repository files the reference lists: `.agent-os/guards.json`,
   `.agent-os/quality.json`, `REVIEW.md`, and, for GitHub Actions repositories, the `lint-intents` and `agent-review` workflows. Propose a
   `CODEOWNERS` entry for intents and specs without writing it.
8. Close with how you will work here, in at most six plain lines, and one recommended first action.

### Return run

A return run adjusts a setup; it never repeats the interview.

1. Inspect as in the first run, and resolve policy ownership the same way.
2. Show a short plain-language summary of what is set today: working agreement, delivery,
   verification, and planning. Under it, flag only what needs attention: drift where the policy
   contradicts the repository, such as a command that no longer exists; any core field, working
   agreement item, or active module the policy does not cover; and **Open setup questions**.
3. Ask one question: what do you want to change? Offer working agreement, delivery, verification,
   planning, and what the summary flagged, plus "nothing, this was a check".
4. Ask only about the chosen areas, under the first run's question rules.
5. Write only the chosen areas and show the diff; everything else stays byte for byte. Agent OS
   repository files change only when a chosen area needs it. "Nothing" writes nothing and leaves any
   flagged drift reported.
6. Close with what changed, what stays flagged, and one recommended next action when one remains.

Block handling remains deterministic: add one missing block, update only well-formed managed content,
and stop on duplicate or malformed markers. Global mode touches no repository files; repo mode
touches one repository. The direct request or recorded delivery defaults govern merge and deploy
actions.
