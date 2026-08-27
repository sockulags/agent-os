---
title: Plugin manifests
description: How one agent-os repository is packaged for Claude Code and Codex.
---

# Plugin manifests

agent-os ships one repository that is a valid plugin — and a valid marketplace — on both platforms.
The plugin manifests and one npm package manifest provide the distribution surfaces.

## `.claude-plugin/plugin.json`

The Claude Code plugin manifest.

```json
{
  "name": "agent-os",
  "description": "A lightweight agent operating system with explicit workflows and automatic disciplines, shared between Claude Code and Codex.",
  "version": "0.12.0",
  "author": { "name": "Lucas Skog" },
  "homepage": "https://sockulags.github.io/agent-os/",
  "repository": "https://github.com/sockulags/agent-os",
  "keywords": ["workflow", "planning", "code-review", "verification", "scope-control", "skills"]
}
```

Claude discovers skills from the `skills/` directory by convention, so no path field is needed.
The packaged `hooks/hooks.json` adds one shared `Stop` hook for the quality-ratchet lifecycle; it
does not install PostToolUse or SessionStart hooks.

## `.claude-plugin/marketplace.json`

Makes the repository installable as a personal marketplace pointing at itself:

```json
{
  "name": "agent-os-marketplace",
  "owner": { "name": "Agent OS Maintainers" },
  "plugins": [
    {
      "name": "agent-os",
      "source": "./",
      "description": "A lightweight agent operating system with explicit workflows and automatic disciplines, shared between Claude Code and Codex."
    }
  ]
}
```

## `.codex-plugin/plugin.json`

The Codex plugin manifest. It needs an explicit `skills` path, and it carries the `interface` block
that Codex surfaces in its plugin UI — including `websiteURL`, which points at this documentation
site.

```json
{
  "name": "agent-os",
  "version": "0.12.0",
  "homepage": "https://sockulags.github.io/agent-os/",
  "repository": "https://github.com/sockulags/agent-os",
  "skills": "./skills/",
  "interface": {
    "displayName": "Agent OS",
    "shortDescription": "Explicit workflows and automatic disciplines",
    "longDescription": "…",
    "developerName": "Lucas Skog",
    "category": "Engineering",
    "websiteURL": "https://sockulags.github.io/agent-os/"
  }
}
```

`homepage` is the top-level pointer; `interface.websiteURL` is the one Codex renders next to the
plugin. Both point at the same place, so a user who finds the plugin through either surface lands on
these docs.

## `.agents/plugins/marketplace.json`

The Codex-side local marketplace:

```json
{
  "name": "agent-os",
  "interface": { "displayName": "Agent OS" },
  "plugins": [
    {
      "name": "agent-os",
      "source": { "source": "local", "path": "./" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    }
  ]
}
```

## `package.json`

The root npm manifest exposes the guided installer as the `agent-os` binary and packages the
complete `skills/` tree with the policy source. Direct installation therefore needs neither a
repository checkout nor a host CLI. The plugin manifests remain available for users who explicitly
choose native marketplace installation.

~~~json
{
  "name": "@sockulags/agent-os",
  "version": "0.12.0",
  "type": "module",
  "bin": {
    "agent-os": "./cli/index.mjs"
  },
  "files": ["cli/", "hooks/", "policy.md", "skills/"]
}
~~~

This makes `npx @sockulags/agent-os install` and `npx @sockulags/agent-os update` self-contained.
The installer records its owned skill directories and managed hook integration in
`.agent-os-install.json`, updates only those directories and the exact Agent OS hook entry, and
preserves unrelated host skills and hook groups. Direct hook commands use an absolute Node path and
the runner copied into that host's managed skill root. The packaged native hook keeps one logical
source: Claude and Unix-like Codex use `CLAUDE_PLUGIN_ROOT`, while Windows Codex uses a quote-free
`commandWindows` with a UTF-16LE PowerShell `-EncodedCommand` payload that resolves
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

Codex reads `skills/<name>/agents/openai.yaml`:

```yaml
policy:
  allow_implicit_invocation: false
```

A manual skill missing one of these is invocable by the model on that platform, which is exactly the
failure mode the [workflow non-invocation eval cases](/reference/evals) exist to catch.

## Version bumps

The version lives in both plugin manifests and `package.json`. All three get bumped in the same
commit, together with the validated documentation copies — see the
[release routine](/reference/release).
