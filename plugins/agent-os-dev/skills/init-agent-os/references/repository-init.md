# Repository initialization contract

Repository mode is a facts-first onboarding pass, not a fixed questionnaire. Inspect the
repository and conversation, then use an internal transient ledger to make omissions visible while
keeping the written policy small.

## Inspect and choose ownership

Read broadly enough to find the current source of truth: every applicable `AGENTS.md`, `CLAUDE.md`,
and `policy.md` in scope; README and project docs; package/build/test configuration; CI and release
configuration; and evidence of frontend, deployment, security, data, batch, or native work. Do not
ask for a fact already established by those sources or by the current conversation.

Before writing, inventory every live host-consumed policy surface and give each unambiguous ownership
and precedence. Shared identical content or a clear canonical cross-reference is sufficient; do not
mandate duplication. Selecting one file while leaving conflicting applicable rules elsewhere is
forbidden. If ownership or the write target cannot be resolved, ask one ownership question and block
the write. A clean repository with no policy surface may receive a new `policy.md`; otherwise update
the resolved canonical surface and preserve unrelated content.

## Completeness ledger

The ledger is internal and transient. For every material field, record one terminal state:

- **evidenced/confirmed** — supported by repository evidence or the user's answer;
- **N/A** — repository evidence makes the field inapplicable;
- **deferred/open** — the user explicitly defers it, to be listed under `Open setup questions`;
- **conflicting** — sources or answers disagree and must be resolved before a default is chosen.

Never treat silence as confirmation. Do not write `N/A`, interview history, or the full ledger to the
policy. Before writing, each core field must reach one of the four terminal states above. Only an
unresolved policy ownership/write-target conflict blocks writing; other explicitly deferred fields
may be written concisely under `Open setup questions`. A conflict is not permission to guess through
the conflict; keep an unresolved conflict visible under `Open setup questions` until it is resolved.

## Required core

Bring each of these fields to one allowed terminal state before the write, asking only where evidence
is insufficient:

1. **Ownership:** the canonical instruction surface and how overlapping policy files are governed.
2. **Delivery boundary:** the default stopping point, branch/PR/merge/deploy expectations, and
   whether external writes, publication, or other effects require a separate explicit request.
3. **Verification:** exact useful commands and the ground truth they establish; record what must be
   inspected manually or otherwise checked when commands are insufficient.
4. **Planning:** where intents live (`intents/` in this repository by default, or a named product
   repository), whether units live in `plan.md` (`source: files`) or a tracker (`source: issues`),
   the branch naming convention, stable plan and decision-ticket identities, epic ownership, and
   dependency conventions. When a tracker is used, write a `## Tracker mandate` section that names
   what the agent may create, update, and comment on, and state that it never changes priority,
   assignee, or acceptance, and never closes items.
5. **Maintenance:** where durable lessons, recurring gotchas, and policy changes are recorded.

## Evidence-gated modules

Add a module only when inspection finds the corresponding concern. Resolve its material defaults and
omit it entirely when inactive:

- frontend/design/rendered QA;
- package, release, or documentation publication;
- CI or deployment;
- authentication, security, billing, or external writes;
- database, migrations, or concurrency;
- batch execution or a monorepo;
- native or desktop tooling.

When a module is active but a decision is not yet safe to infer, ask one question at a time. Each
question includes the recommended option and the consequence of choosing differently. Explicitly
deferred answers are written only as concise `Open setup questions`; they do not become guessed
defaults. They do not block the write unless the deferral leaves policy ownership or the write target
unresolved.

## Agent OS repository files

Besides the policy, repository mode writes these files when they are absent, from the templates in
this skill's `references/` and `templates/` directories, and shows each in the diff. An existing
file is updated only where it lacks a field the policy now depends on.

- **`.agent-os/guards.json`** from [guards.md](guards.md): protected paths found by inspection
  (migrations, CI workflows, generated or vendored code), the default frozen intent and spec globs,
  and `secretScan: true`.
- **`.agent-os/quality.json`** with the verification field's main test command as a `required`
  check, following quality-ratchet's project-controls reference. Tell the developer to run its
  `trust` command once in a terminal; never run it yourself.
- **`REVIEW.md`** from [review-template.md](review-template.md), filled with the repository's real
  focus areas and any severity rules already stated in its contributing guide.
- **`.github/workflows/lint-intents.yml`** and **`.github/workflows/agent-review.yml`** from
  `templates/`, only when the repository uses GitHub Actions. The review workflow needs an API key
  secret that a person must add; list it under `Open setup questions` until it exists.

Propose, but do not write, a `CODEOWNERS` entry that names who approves `intents/**/intent.md` and
`intents/**/spec.md`: it changes who must review other people's work, so it is the team's decision.

## Write contract

Write only durable behavior-changing defaults and relevant active sections. Keep the policy sparse:
do not add a schema, checklist, or interview transcript. Preserve existing unrelated instructions.
The explicit `init-agent-os` invocation authorizes this setup write, so do not ask for a second
approval. Show the resulting diff.
