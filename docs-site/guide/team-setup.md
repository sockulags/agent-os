---
title: Team setup
description: Keep Agent OS on the same version across a team, update it, govern the shared policy, and remove it.
---

# Team setup

Each developer installs Agent OS on their own machine, so versions drift unless someone checks. This
page covers how to see each machine's version, keep installs current, decide who changes the shared
policy, and remove Agent OS.

## Pick one installation method per host

Use either the direct install or the plugin on each host, not both. With both, every skill appears
twice: `/agent-os-core:<skill>` or `/agent-os-dev:<skill>` and `/<skill>` in Claude Code, and two
entries per skill in Codex. The
`doctor` command below warns when it finds both.

## See which version each machine runs

```bash
npx @sockulags/agent-os@latest doctor
```

`doctor` is read-only. It reports:

- the version of each direct install, the skills that a later release removed but are still on disk,
  and skills that are missing;
- the installed packages of each direct install, and the recorded version of each Claude and Codex
  plugin install, including an old single `agent-os` plugin that must be replaced;
- whether the Agent OS block in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` matches this release.
  Each block starts with a `<!-- agent-os version X -->` line;
- whether the quality-ratchet Stop hook and the guard hooks are configured where agent-os-dev is
  installed;
- whether a newer version is published on npm. `--offline` skips that lookup.

Each finding says how to fix it. For a plugin-only user whose policy block is old, that is the
`init-agent-os global` skill, because the CLI's `update` would add a direct install next to the
plugin. A Claude plugin loaded in place from a local directory marketplace is judged by the
`plugin.json` in that directory, not by its recorded version. The command exits with 1 when an
install differs from the CLI, so a team can run it in an onboarding script. The `list-skills` skill also prints the
installed version inside a session.

## Keep installs current

**Direct installs** never update themselves. Each developer runs the update for the platform and
scope they installed, then starts a new host session:

```bash
npx @sockulags/agent-os@latest update --platform both --scope user
```

**Claude Code plugin installs.** Claude Code turns on auto-update by default for the official
Anthropic marketplaces; third-party marketplaces such as this one default to off. A developer can
turn it on in `/plugin` under Marketplaces. A team can set `autoUpdate` for everyone through managed
settings, or through a repository's `.claude/settings.json`, which applies once the developer trusts
the workspace:

```json
{
  "extraKnownMarketplaces": {
    "agent-os-marketplace": {
      "source": { "source": "github", "repo": "sockulags/agent-os" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "agent-os-core@agent-os-marketplace": true,
    "agent-os-dev@agent-os-marketplace": true
  }
}
```

In managed settings, the same `enabledPlugins` entries force-enable the plugins so developers cannot
turn them off. A team that only plans and documents can enable `agent-os-core` alone. An update
applies after `/reload-plugins` or a restart. Without auto-update, run
`claude plugin marketplace update agent-os-marketplace` and then
`claude plugin update agent-os-core@agent-os-marketplace` and
`claude plugin update agent-os-dev@agent-os-marketplace`, adding `--scope project` or
`--scope local` for those installs. Sources, read 2026-10-17: the `extraKnownMarketplaces` entry in the Claude Code
[settings reference](https://code.claude.com/docs/en/settings-reference),
[plugins for organizations](https://code.claude.com/docs/en/plugins/org), and
[turning on auto-update](https://code.claude.com/docs/en/plugins/host-marketplace#turn-on-auto-update).

**Codex plugin installs.** Run `codex plugin marketplace upgrade agent-os`, reinstall both plugins,
and start a new session.

**Codex hooks.** Codex runs a non-managed hook only after you trust it in `/hooks`. It records trust
against the hook's hash, so an update that changes a hook needs trust again. The installer prints a
reminder whenever it changes the Codex hooks.

## Move from the single agent-os plugin

Before the split, one plugin named `agent-os` carried every skill. It is replaced by `agent-os-core`
and `agent-os-dev`, and the marketplace no longer lists `agent-os`. `doctor` reports an old install
with the exact commands. For Claude Code:

```bash
claude plugin marketplace update agent-os-marketplace
claude plugin uninstall agent-os@agent-os-marketplace
claude plugin install agent-os-core@agent-os-marketplace
claude plugin install agent-os-dev@agent-os-marketplace
```

For Codex, run `codex plugin marketplace upgrade agent-os`, remove `agent-os` in `/plugins`, then
add `agent-os-core@agent-os` and `agent-os-dev@agent-os`. Update managed settings that enabled
`agent-os@agent-os-marketplace` to name both new plugins. Direct installs need only the usual
`npx @sockulags/agent-os@latest update`: it installs both packages, removes the retired skills, and
adds the guard hooks. Invocations change from `/agent-os:<skill>` to `/agent-os-core:<skill>` or
`/agent-os-dev:<skill>`; direct and Codex invocations stay the same. Renamed skills: `understand-work`
is now `capture-intent`, and `simplifier`, `simplifier-review`, and `simplifier-audit` are now
`simplify`. `notice-lesson` is part of `record-lesson`.

## Who changes the global policy

`policy.md` in this repository is the only source of the global policy block. A change goes through a
pull request, and `.github/CODEOWNERS` requires review from the maintainers. Developers receive it
with their next update, and `doctor` shows who still runs the old block.

Do not edit inside the `<!-- BEGIN AGENT OS -->` markers: the next update replaces that text. Put a
personal rule outside the markers in `~/.claude/CLAUDE.md` or `~/.codex/AGENTS.md`; the installer
never changes text outside them. Put a rule for one repository in that repository's
[project policy](/guide/project-policy).

## Remove Agent OS

There is no uninstall command yet.

- **Claude Code plugins:** `claude plugin uninstall agent-os-dev@agent-os-marketplace` and
  `claude plugin uninstall agent-os-core@agent-os-marketplace`.
- **Codex plugin:** open `/plugins` and choose "Uninstall plugin".
- **Direct install:** delete the skill directories listed in `.agent-os-install.json` in the skill
  root, then the manifest itself. Remove the hook entries that contain `--agent-os-hook=quality-ratchet`
  or `--agent-os-hook=guards` from `~/.claude/settings.json` or `~/.codex/hooks.json`, and keep the
  other hooks. Reinstalling with `--package core` removes the managed hooks for you.
- **Global policy:** delete the text from `<!-- BEGIN AGENT OS -->` to `<!-- END AGENT OS -->`
  inclusive.
- **Project controls trust:** delete `~/.agent-os/trusted-controls.json`.
