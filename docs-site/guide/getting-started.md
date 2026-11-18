---
title: Getting started
description: Install agent-os, initialize policy, and choose the first workflow for a task.
---

# Getting started

The guided npm installer is the fastest path. It installs the packaged skills directly, optionally
syncs the global policy, and leaves repository-specific policy initialization for the repository
where you will work. Codex and Claude Code do not need to be installed before this step.

Agent OS has two packages. **agent-os-core** holds intent, planning, explanation, scope, evidence,
and lesson skills that help any agent work. **agent-os-dev** holds delivery, review, testing,
simplification, and setup skills plus the hooks that enforce them, and requires agent-os-core. The
installer installs both unless you choose core only.

## 1. Install the skills

Run this from any directory:

~~~bash
npx @sockulags/agent-os install
~~~

The CLI asks whether to install for Codex, Claude Code, or both, whether the skills should be
user-level or project-level, which packages to install, and whether to sync the shared policy files.
For automation, provide the choices explicitly:

~~~bash
npx @sockulags/agent-os install --platform both --scope user --yes
npx @sockulags/agent-os install --platform claude --package core --yes
npx @sockulags/agent-os update --platform codex --scope user --no-policy
~~~

`--package all` (the default) installs agent-os-core and agent-os-dev. `--package core` installs only
the core skills, adds no hooks, and installs the global policy without its development section.
Updating an all-packages install with `--package core` removes the dev skills and the managed hooks.

The direct installer writes to these locations:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/skills` | `~/.codex/skills` |
| Project | `<project>/.claude/skills` | `<project>/.agents/skills` |

An update replaces only the skills Agent OS installed, removes skills a release retired, and leaves
your other skills alone. It never overwrites a skill directory it did not install.

With agent-os-dev, direct installs also merge three Agent OS-owned hooks without replacing unrelated
host hooks: the quality-ratchet `Stop` gate and the `SessionStart` and `PreToolUse` guard hooks
described in [Guard hooks](/reference/guards). They go into:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/settings.json` | `~/.codex/hooks.json` |
| Project | `<project>/.claude/settings.json` | `<project>/.codex/hooks.json` |

Start a new session after updating. There is no uninstall command yet.

Codex runs a non-managed hook only after you trust it, and it records that trust against the hook's
hash. After a Codex install, or an update that changes the hooks, open Codex, run `/hooks`, and trust
the Agent OS quality-ratchet and guard hooks. Until then Codex skips them. The installer prints this
reminder whenever it changes the Codex hooks.

Use `npx @sockulags/agent-os@latest update` to force the latest published installer. A global CLI
install is optional:

~~~bash
npm install --global @sockulags/agent-os@latest
agent-os update
~~~

Direct Claude skills are invoked as `/<skill>`, for example `/shape-work`. Codex skills are invoked
as `$<skill>`, for example `$shape-work`. Start a new host session after installing or updating so
the host discovers the new files.

### Optional: native plugin installation

If you specifically want host-managed marketplace installation, choose `--method plugin`:

~~~bash
npx @sockulags/agent-os install --platform codex --method plugin
npx @sockulags/agent-os install --platform claude --method plugin --scope user
~~~

Plugin mode requires the selected host CLI and installs two plugins, `agent-os-core` and
`agent-os-dev`, or only core with `--package core`. Claude plugin skills use the namespaces
`/agent-os-core:<skill>` and `/agent-os-dev:<skill>`; Codex plugin skills remain `$<skill>`. By hand:

~~~bash
claude plugin marketplace add sockulags/agent-os
claude plugin install agent-os-core@agent-os-marketplace
claude plugin install agent-os-dev@agent-os-marketplace
~~~

Plugin hooks need Node on PATH, and PowerShell as well on Windows. How the installer records what
it owns, how the hooks are wired on each host, and how to run Agent OS from a clone are described in
[Plugin manifests](/reference/plugin-manifests#installer-details).

### Verify the install

Start a new Codex or Claude Code session and invoke [`list-skills`](/skills/list-skills), which
reads the installation itself and reports every skill it finds with the invocation form for your
host. Compare that card against the [skills overview](/skills/): every skill in the table should be
present. If only some appear, run the update command for the same platform and scope before
debugging anything else.

From a terminal, `npx @sockulags/agent-os@latest doctor` reports the installed version of every
direct and plugin install, the installed packages, the global policy blocks, and the hooks, and names
the command that fixes each difference. It changes nothing. For keeping a whole team on one version, see
[Team setup](/guide/team-setup).

## 2. Install or refresh the global policy

The npm installer can do this during installation. Its Node-based writer updates only the managed
`<!-- BEGIN AGENT OS -->` block in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, preserves text
outside the block, and aborts before installing skills if markers are malformed.

If you chose `--no-policy`, invoke the setup skill once per machine after opening the host:

```text
/init-agent-os global                 # direct Claude install
/agent-os-dev:init-agent-os global        # Claude plugin install
$init-agent-os global                 # Codex
```

The skill runs the bundled deterministic Node writer and shows the resulting diff. Never edit
inside the managed markers by hand — see [Global policy](/guide/global-policy) for why. Run it once
after installing even when the installer synced the policy: it also asks your personal preferences,
such as how much the agent explains, and keeps them outside the managed block.

Re-run either the npm update with policy sync enabled or `init-agent-os global` after a release that
changes `policy.md`. The installed blocks do not update themselves.

## 3. Initialize a repository

In the repository you want to work in, invoke `init-agent-os` without `global`. It reads the repo
first and asks how you want to work there: who approves, where the agent stops, the default path for
a new feature, and where units live. Then it asks only about missing facts: verification,
design-system location, where intents live, stable identities, batch execution, and durable
conventions. Every question arrives with a recommendation. Run it again at any time: it shows what
is set and asks what you want to change. It writes the
smallest useful policy, `.agent-os/guards.json`, `.agent-os/quality.json` with the main test command
as a required check, `REVIEW.md`, and, for GitHub Actions repositories, the `lint-intents` and
`agent-review` workflows, and shows the resulting diff.

The result is the repository's [project policy](/guide/project-policy), a living document that
`record-lesson` extends when a session produces a durable lesson.

## Your first run

[Where to start](/guide/where-to-start) matches the situation you are in to the skill that fits, and
the [glossary](/guide/glossary) explains the words the skills use. When you cannot yet say what you
want, describe the problem to `capture-intent`:

```text
/capture-intent Something about this project feels off and I don't know where to start
```

That example uses a direct Claude install. Use `/agent-os-core:capture-intent` in the Claude plugin
or `$capture-intent` in Codex. It asks one question at a time until the need is clear, and then
`shape-work` can turn it into tracker issues.

Nothing forces you to use a workflow. The disciplines are active in every session: the agent
reproduces before it patches, keeps unrelated cleanup out of your diff, and shows command output
before it says the work is done.

Next: [The work loop](/guide/the-work-loop).
