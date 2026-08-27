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

## The quality-ratchet Stop hook blocks

**Symptom:** the host asks for another turn instead of stopping.

The hook blocks only an active lifecycle problem. In the implementation worktree, inspect the
candidate with:

```text
node "<installed quality-ratchet runner>" check
```

Run `check` or `clear` from the same host session that owns the blocked lifecycle. Those commands
bind state through `CODEX_THREAD_ID` or `CLAUDE_CODE_SESSION_ID`, with Codex taking precedence when
both exist; native Stop uses its `session_id` payload and distinguishes Codex by non-empty `turn_id`.
A manual invocation with neither identity uses the deterministic standalone fallback instead of
another host session's state.

For direct installs, the runner is under `~/.claude/skills/quality-ratchet/scripts/quality-delta.mjs`
or `~/.codex/skills/quality-ratchet/scripts/quality-delta.mjs` at user scope, and
`<project>/.claude/skills/quality-ratchet/scripts/quality-delta.mjs` or
`<project>/.agents/skills/quality-ratchet/scripts/quality-delta.mjs` at project scope. Resolve it
relative to the loaded `quality-ratchet/SKILL.md` rather than assume a checkout.

It compares the exact entry baseline with the candidate and reports source-file, touched NLOC,
legacy-before/after, package dependency, and optional-analyzer evidence. Counts are signals for
semantic review, not score or threshold gates. Missing Lizard or jscpd is explicitly unavailable,
not clean. A worktree with no active baseline is a no-op.

If the attempt was abandoned, clear only its active lifecycle state:

```text
node "<installed quality-ratchet runner>" clear
```

The checkout-relative `node skills/quality-ratchet/scripts/quality-delta.mjs ...` command applies
only during repository or native-plugin development where that file exists.

Restart the host after a direct update. For Claude plugin development use `/reload-plugins` where
supported; Codex needs a new session. Direct hooks live in `~/.claude/settings.json` or
`<project>/.claude/settings.json`, and `~/.codex/hooks.json` or `<project>/.codex/hooks.json`.
The installer preserves unrelated hook groups and replaces only the stable Agent OS marker. There
is no uninstall command yet; disable safely by removing only that managed entry and keeping the
rest of the host configuration. Native plugin hooks require Node on PATH.

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

This is the design for manual workflows, not a failure. Manual workflows carry
`disable-model-invocation: true` (Claude) and `allow_implicit_invocation: false` (Codex), so
resembling one never activates it. `check-work` is the automatic review-workflow exception and
triggers for supported candidate-review requests. Invoke
explicitly: `/<skill>` for direct Claude skills, `/agent-os:<skill>` for the Claude plugin, or
`$<skill>` on Codex. The
[non-invocation eval cases](/reference/evals) exist precisely to keep naive phrasings from
triggering workflows implicitly.

The automatic disciplines are the opposite: they need no invocation and activate from the
situation. If a discipline seems inert, check that the plugin version is current (first section)
before assuming the trigger failed.
