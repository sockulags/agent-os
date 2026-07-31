---
title: Getting started
description: Install agent-os, initialize policy, and choose the first workflow for a task.
---

# Getting started

Installing agent-os takes three steps: install the plugin on the platforms you use, install the
global policy block on your machine, and give each repository its own project policy.

## 1. Install the plugin

### Claude Code

For development against a clone, run Claude from the repository root with the plugin directory
pointed at it, then reload:

```bash
claude --plugin-dir .
```

Inside the session, run `/reload-plugins` after any change to a skill file.

For normal use, add the repository as a personal marketplace and install the `agent-os` plugin from
it. The repository ships `.claude-plugin/marketplace.json` alongside `.claude-plugin/plugin.json`, so
it is a valid marketplace on its own. Skills then appear under the plugin namespace as
`/agent-os:<skill>`.

### Codex

Codex installs from the local repository marketplace at `.agents/plugins/marketplace.json`.
Installation copies the plugin into the Codex cache, which means a change to a skill file is not
visible until you reinstall or refresh the plugin **and** start a new session. Skills appear as
`$<skill>`.

### Verify the install

Ask the agent to list its available skills. All ten should be present under the `agent-os`
namespace. If only some appear, the plugin was loaded from a stale cache — reinstall before
debugging anything else.

## 2. Install the global policy

Run the setup skill in global mode once per machine:

```text
/agent-os:init-agent-os global
```

It checks that the plugin is visible, reports drift, applies the managed blocks through the
deterministic script, and shows the resulting diff. The explicit setup invocation authorizes these
writes.

The block is delimited by `<!-- BEGIN AGENT OS -->` and `<!-- END AGENT OS -->` markers, and the
PowerShell script `skills/init-agent-os/scripts/policy-block.ps1` is its only writer. Never edit
inside the markers by hand — see [Global policy](/guide/global-policy) for why.

## 3. Initialize a repository

In the repository you want to work in, run the same skill without an argument:

```text
/agent-os:init-agent-os
```

It reads the repo first and asks only about missing material defaults: delivery, verification,
design-system location, planning surface, batch execution, and durable conventions. Every question
arrives with a recommendation. It writes the smallest useful policy and shows the resulting diff.

The result is the repository's [project policy](/guide/project-policy), a living document that
`deliver-work` will later propose additions to.

## Your first run

For a bounded change with open product questions, start at the top:

```text
/agent-os:shape-work Add CSV export to the reports page
```

For work whose decisions are already made, go straight to delivery:

```text
/agent-os:deliver-work Fix the timezone offset in the nightly digest
```

When you explicitly want several implementation-ready, dependency-mapped issues executed and
integrated as one batch, invoke it:

```text
/agent-os:batch-work Execute the platform migration work units
```

Nothing forces you to use a workflow at all. The disciplines are active in every session regardless,
which is most of the day-to-day value: the agent reproduces before it patches, keeps unrelated
cleanup out of your diff, and shows you the command output before it says the work is done.

Next: [The work loop](/guide/the-work-loop).
