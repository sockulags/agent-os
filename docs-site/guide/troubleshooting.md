---
title: Troubleshooting
description: The known failure modes — stale Codex cache, silent policy drift, and skills that do not trigger.
---

# Troubleshooting

Three failure modes account for nearly every "agent-os is not working" moment. All three have
deterministic checks.

## Skills are missing or outdated

**Symptom:** the agent lists only some skills, or a skill behaves like an older version.

For the default direct installation, update the same platform and scope you originally selected,
then start a new host session:

```bash
npx @sockulags/agent-os@latest update --platform codex --scope user --no-policy
```

The `.agent-os-install.json` file in the target skill root records which directories the installer
owns. The updater preserves unrelated skills and refuses to overwrite unmanaged same-name
directories.

For optional plugin mode, Codex installs by copying into a cache. Reinstall and start a new session.
Refresh a Git-sourced marketplace first with `codex plugin marketplace upgrade agent-os`; do not run
that command for a local marketplace because it is not a Git source. On Claude Code the development
loop is `claude --plugin-dir .` plus `/reload-plugins`.

Compare the agent's skill list against the [skills overview](/skills/) — if they differ, fix the
cache before debugging anything else.

## Plugin mode cannot find a host CLI

Direct installation does not require Codex or Claude Code. If you selected `--method plugin`, install
the selected host CLI or rerun without that option:

~~~bash
npm install --global @openai/codex
npm install --global @anthropic-ai/claude-code
~~~

Use `npx @sockulags/agent-os update` to refresh an existing direct installation. Use
`npx @sockulags/agent-os@latest update` when the installer itself is stale, or
`npm install --global @sockulags/agent-os@latest` when you keep the CLI
installed globally.

## The global policy block is stale

**Symptom:** the agent follows old rules, or rules on one platform but not the other.

Nothing updates the installed blocks automatically when `policy.md` changes — drift is silent.
Check without writing:

```powershell
pwsh skills/init-agent-os/scripts/policy-block.ps1 -Check
```

Exit `0` is in sync; `1` is drift or a missing block; `2` is malformed markers. On drift, run
`init-agent-os global` to reinstall. Never edit inside the `<!-- BEGIN/END AGENT OS -->` markers by
hand. Both the npm installer's Node writer and the setup skill's PowerShell writer use the same
managed-block rules, and hand edits are overwritten on the next sync.

## A workflow skill did not trigger

**Symptom:** you described exactly what a workflow does, and the agent handled the request directly
instead of running the workflow.

This is the design, not a failure. Every workflow carries `disable-model-invocation: true` (Claude)
and `allow_implicit_invocation: false` (Codex), so resembling a workflow never activates it. Invoke
explicitly: `/<skill>` for direct Claude skills, `/agent-os:<skill>` for the Claude plugin, or
`$<skill>` on Codex. The
[non-invocation eval cases](/reference/evals) exist precisely to keep naive phrasings from
triggering workflows implicitly.

The automatic disciplines are the opposite: they need no invocation and activate from the
situation. If a discipline seems inert, check that the plugin version is current (first section)
before assuming the trigger failed.
