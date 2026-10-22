---
title: Plugin manifests
description: How one agent-os repository is packaged as two plugins for Claude Code and Codex, and as one npm package.
---

# Plugin manifests

agent-os ships one repository with two plugin roots, `plugins/agent-os-core` and
`plugins/agent-os-dev`, and one marketplace per host at the repository root that lists both. Each
plugin root is self-contained, because a plugin install copies only that directory: a skill in one
package never links to a file in the other, and the validator fails such a link. agent-os-dev
requires agent-os-core. Both packages share one version.

```text
.claude-plugin/marketplace.json        Claude marketplace listing both plugins
.agents/plugins/marketplace.json       Codex marketplace listing both plugins
plugins/agent-os-core/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
plugins/agent-os-dev/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  hooks/hooks.json
  skills/
policy.md                              global policy source
package.json                           npm installer
```

## `plugins/<name>/.claude-plugin/plugin.json`

The Claude Code plugin manifests. The dev manifest looks like this, and the core manifest differs in
`name`, `description`, and `keywords`:

```json
{
  "name": "agent-os-dev",
  "description": "Agent OS development: shape plans, deliver against ground truth, review independently, and guard delivery with hooks. Requires agent-os-core.",
  "version": "0.15.0",
  "author": { "name": "Lucas Skog" },
  "homepage": "https://sockulags.github.io/agent-os/",
  "repository": "https://github.com/sockulags/agent-os",
  "keywords": ["workflow", "delivery", "code-review", "testing", "hooks", "skills"]
}
```

Claude discovers skills from each plugin's `skills/` directory by convention. The dev plugin's
`hooks/hooks.json` registers the quality-ratchet `Stop` hook and the `SessionStart` and `PreToolUse`
guard hooks; the core plugin has no hooks.

## `.claude-plugin/marketplace.json`

Makes the repository installable as a marketplace that lists both plugins:

```json
{
  "name": "agent-os-marketplace",
  "owner": { "name": "Agent OS Maintainers" },
  "plugins": [
    { "name": "agent-os-core", "source": "./plugins/agent-os-core", "description": "…" },
    { "name": "agent-os-dev", "source": "./plugins/agent-os-dev", "description": "…" }
  ]
}
```

Before the split the marketplace listed one plugin, `agent-os`, from `./`. See
[Team setup](/guide/team-setup#move-from-the-single-agent-os-plugin) for the migration.

## `plugins/<name>/.codex-plugin/plugin.json`

The Codex plugin manifests. Each needs an explicit `skills` path, and carries the `interface` block
that Codex surfaces in its plugin UI, including `websiteURL`, which points at this documentation
site.

```json
{
  "name": "agent-os-core",
  "version": "0.15.0",
  "homepage": "https://sockulags.github.io/agent-os/",
  "repository": "https://github.com/sockulags/agent-os",
  "skills": "./skills/",
  "interface": {
    "displayName": "Agent OS Core",
    "shortDescription": "Intent, planning, and evidence disciplines",
    "longDescription": "…",
    "developerName": "Lucas Skog",
    "category": "Productivity",
    "websiteURL": "https://sockulags.github.io/agent-os/"
  }
}
```

`homepage` is the top-level pointer; `interface.websiteURL` is the one Codex renders next to the
plugin. Both point at the same place, so a user who finds a plugin through either surface lands on
these docs.

## `.agents/plugins/marketplace.json`

The Codex-side local marketplace:

```json
{
  "name": "agent-os",
  "interface": { "displayName": "Agent OS" },
  "plugins": [
    {
      "name": "agent-os-core",
      "source": { "source": "local", "path": "./plugins/agent-os-core" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    },
    {
      "name": "agent-os-dev",
      "source": { "source": "local", "path": "./plugins/agent-os-dev" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Engineering"
    }
  ]
}
```

## `package.json`

The root npm manifest exposes the guided installer as the `agent-os` binary and packages both plugin
roots with the policy source. Direct installation therefore needs neither a repository checkout nor
a host CLI. The plugin manifests remain available for users who explicitly choose native marketplace
installation.

~~~json
{
  "name": "@sockulags/agent-os",
  "version": "0.15.0",
  "type": "module",
  "bin": {
    "agent-os": "./cli/index.mjs"
  },
  "files": ["cli/", "plugins/", "policy.md"]
}
~~~

This makes `npx @sockulags/agent-os install` and `npx @sockulags/agent-os update` self-contained.
A direct install copies the skills of the selected packages side by side into one skill root. The
installer records its owned skill directories, the installed packages, and the managed hook
integration in `.agent-os-install.json`, updates only those directories and the exact Agent OS hook
entries, and preserves unrelated host skills and hook groups. Direct hook commands use an absolute
Node path and the runners copied into that host's managed skill root. The packaged native hooks keep
one logical source: Claude and Unix-like Codex use `CLAUDE_PLUGIN_ROOT`, while Windows Codex uses a
quote-free `commandWindows` with a UTF-16LE PowerShell `-EncodedCommand` payload that resolves
`$env:PLUGIN_ROOT`; Node and PowerShell on PATH are required for the native path.

## Per-skill invocation gating

Manual invocation is expressed differently on each platform, and both files must exist for every
manual skill. Automatic skills carry neither gate; an automatic workflow may still be explicitly
named when the developer wants its documented mode.

Claude reads frontmatter in `SKILL.md`:

```yaml
---
name: shape-work
description: …
disable-model-invocation: true
---
```

Codex reads `plugins/<package>/skills/<name>/agents/openai.yaml`:

```yaml
policy:
  allow_implicit_invocation: false
```

A manual skill missing one of these is invocable by the model on that platform, which is exactly the
failure mode the [workflow non-invocation eval cases](/reference/evals) exist to catch.

## Version bumps

The version lives in the four plugin manifests and `package.json`. All five get bumped in the same
commit, together with the validated documentation copies; see the
[release routine](/reference/release).
