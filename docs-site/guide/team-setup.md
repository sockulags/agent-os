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
twice: `/agent-os:<skill>` and `/<skill>` in Claude Code, and two entries per skill in Codex. The
`doctor` command below warns when it finds both.

## See which version each machine runs

```bash
npx @sockulags/agent-os@latest doctor
```

`doctor` is read-only. It reports:

- the version of each direct install, the skills that a later release removed but are still on disk,
  and skills that are missing;
- the recorded version of each Claude and Codex plugin install;
- whether the Agent OS block in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` matches this release.
  Each block starts with a `<!-- agent-os version X -->` line;
- whether the quality-ratchet Stop hook is configured;
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
  "enabledPlugins": { "agent-os@agent-os-marketplace": true }
}
```

In managed settings, `"enabledPlugins": { "agent-os@agent-os-marketplace": true }` force-enables the
plugin so developers cannot turn it off. An update applies after `/reload-plugins` or a restart.
Without auto-update, run `claude plugin marketplace update agent-os-marketplace` and then
`claude plugin update agent-os@agent-os-marketplace`, adding `--scope project` or `--scope local`
for those installs. Sources, read 2026-10-17: the `extraKnownMarketplaces` entry in the Claude Code
[settings reference](https://code.claude.com/docs/en/settings-reference),
[plugins for organizations](https://code.claude.com/docs/en/plugins/org), and
[turning on auto-update](https://code.claude.com/docs/en/plugins/host-marketplace#turn-on-auto-update).

**Codex plugin installs.** Run `codex plugin marketplace upgrade agent-os`, reinstall the plugin, and
start a new session.

**Codex hooks.** Codex runs a non-managed hook only after you trust it in `/hooks`. It records trust
against the hook's hash, so an update that changes the hook needs trust again. The installer prints a
reminder whenever it changes the Codex hook.

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

- **Claude Code plugin:** `claude plugin uninstall agent-os@agent-os-marketplace`.
- **Codex plugin:** open `/plugins` and choose "Uninstall plugin".
- **Direct install:** delete the skill directories listed in `.agent-os-install.json` in the skill
  root, then the manifest itself. Remove the hook entry that contains `--agent-os-hook=quality-ratchet`
  from `~/.claude/settings.json` or `~/.codex/hooks.json`, and keep the other hooks.
- **Global policy:** delete the text from `<!-- BEGIN AGENT OS -->` to `<!-- END AGENT OS -->`
  inclusive.
- **Project controls trust:** delete `~/.agent-os/trusted-controls.json`.
