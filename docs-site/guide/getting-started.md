---
title: Getting started
description: Install agent-os, initialize policy, and choose the first workflow for a task.
---

# Getting started

The guided npm installer is the fastest path. It installs the packaged skills directly, optionally
syncs the global policy, and leaves repository-specific policy initialization for the repository
where you will work. Codex and Claude Code do not need to be installed before this step.

## 1. Install the skills

Run this from any directory:

~~~bash
npx @sockulags/agent-os install
~~~

The CLI asks whether to install for Codex, Claude Code, or both, whether the skills should be
user-level or project-level, and whether to sync the shared policy files. For automation, provide
the choices explicitly:

~~~bash
npx @sockulags/agent-os install --platform both --scope user --yes
npx @sockulags/agent-os update --platform codex --scope user --no-policy
~~~

The direct installer writes to these locations:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/skills` | `~/.codex/skills` |
| Project | `<project>/.claude/skills` | `<project>/.agents/skills` |

These are the locations managed and verified by the current Agent OS installer. OpenAI's general
Codex documentation now also lists `~/.agents/skills` for user-level authoring. Agent OS keeps its
existing managed user location for backward compatibility; it will not move an installation until
both discovery and update behavior have been verified as one migration.

It records the Agent OS-owned directories in `.agent-os-install.json`. An update replaces only
those directories, removes managed skills that disappeared from the release, and leaves unrelated
skills alone. Schema 1 manifests remain readable; new installs record the managed quality-ratchet
hook integration in schema 2. It refuses to overwrite a same-name directory that it did not install.

Direct installs also merge one Agent OS-owned `Stop` hook without replacing unrelated host hooks:

| Scope | Claude Code | Codex |
|---|---|---|
| User | `~/.claude/settings.json` | `~/.codex/hooks.json` |
| Project | `<project>/.claude/settings.json` | `<project>/.codex/hooks.json` |

Malformed or ambiguous managed hook configuration aborts before skill or hook mutation. The direct
command uses absolute paths to the Node executable and the runner copied into the selected skill
root. Start a new session after updating;
there is no uninstall command yet.

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

Plugin mode requires the selected host CLI. Claude plugin skills use the namespace
`/agent-os:<skill>`; Codex plugin skills remain `$<skill>`. Native plugin mode loads the packaged
shared `Stop` hook through `CLAUDE_PLUGIN_ROOT` on Unix-like hosts and Codex's quote-free
`commandWindows` with a UTF-16LE PowerShell `-EncodedCommand` payload on Windows. The decoded script
resolves `$env:PLUGIN_ROOT` at runtime. Node and PowerShell must be on PATH.

For development against a clone, Claude can run `claude --plugin-dir .`. Codex can register the
working copy with `codex plugin marketplace add /path/to/agent-os`. A local Codex marketplace is
already the source, so the updater skips the Git-only marketplace upgrade step and reinstalls the
plugin directly.

### Verify the install

Start a new Codex or Claude Code session and invoke [`list-skills`](/skills/list-skills), which
reads the installation itself and reports every skill it finds with the invocation form for your
host. Compare that card against the [skills overview](/skills/): every skill in the table should be
present. If only some appear, run the update command for the same platform and scope before
debugging anything else.

## 2. Install or refresh the global policy

The npm installer can do this during installation. Its Node-based writer updates only the managed
`<!-- BEGIN AGENT OS -->` block in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, preserves text
outside the block, and aborts before installing skills if markers are malformed.

If you chose `--no-policy`, invoke the setup skill once per machine after opening the host:

```text
/init-agent-os global                 # direct Claude install
/agent-os:init-agent-os global        # Claude plugin install
$init-agent-os global                 # Codex
```

The skill uses the bundled deterministic PowerShell writer and shows the resulting diff. Never edit
inside the managed markers by hand — see [Global policy](/guide/global-policy) for why.

Re-run either the npm update with policy sync enabled or `init-agent-os global` after a release that
changes `policy.md`. The installed blocks do not update themselves.

## 3. Initialize a repository

In the repository you want to work in, invoke `init-agent-os` without `global`. It reads the repo
first and asks only about missing material defaults: delivery, verification, design-system
location, planning surface, batch execution, and durable conventions. Every question arrives with
a recommendation. It writes the smallest useful policy and shows the resulting diff.

The result is the repository's [project policy](/guide/project-policy), a living document that
`deliver-work` will later propose additions to.

## Your first run

For a bounded change with open product questions, invoke `shape-work` with the task. For work whose
decisions are already made, use `deliver-work`. Use `batch-work` only when you explicitly want
several implementation-ready, dependency-mapped issues executed and integrated as one batch.

When you cannot yet say what you want, invoke `guide-me`. For example:

```text
/guide-me Something about this project feels off and I don't know where to start
```

That example uses a direct Claude install. Use `/agent-os:guide-me` in the Claude plugin or
`$guide-me` in Codex. The workflow questions out the need, plays the goal back as a plain-language
summary you approve or challenge, and only then continues into charting or shaping.

Nothing forces you to use a workflow. The disciplines are active in every session: the agent
reproduces before it patches, keeps unrelated cleanup out of your diff, and shows command output
before it says the work is done.

Next: [The work loop](/guide/the-work-loop).
