---
title: Troubleshooting
description: The known failure modes — stale Codex cache, silent policy drift, and skills that do not trigger.
---

# Troubleshooting

Three failure modes account for nearly every "agent-os is not working" moment. All three have
deterministic checks.

## Skills are missing or outdated

**Symptom:** the agent lists only some skills, or a skill behaves like an older version.

Codex installs by copying into a cache, so the installed plugin does not follow your clone. After
any skill change — yours or a plugin update — reinstall and start a new session:

```bash
codex plugin add agent-os@agent-os
```

For a Git-sourced marketplace, refresh the snapshot first with
`codex plugin marketplace upgrade agent-os`. `codex plugin list` shows what Codex is actually
serving. On Claude Code the development loop is `claude --plugin-dir .` plus `/reload-plugins`; for
a marketplace install, update the plugin and start a new session.

Compare the agent's skill list against the [skills overview](/skills/) — if they differ, fix the
cache before debugging anything else.

## The global policy block is stale

**Symptom:** the agent follows old rules, or rules on one platform but not the other.

Nothing updates the installed blocks automatically when `policy.md` changes — drift is silent.
Check without writing:

```powershell
pwsh skills/init-agent-os/scripts/policy-block.ps1 -Check
```

Exit `0` is in sync; `1` is drift or a missing block; `2` is malformed markers. On drift, run
`init-agent-os global` to reinstall. Never edit inside the `<!-- BEGIN/END AGENT OS -->` markers by
hand — the script is the only writer, and hand edits are overwritten on the next sync.

## A workflow skill did not trigger

**Symptom:** you described exactly what a workflow does, and the agent handled the request directly
instead of running the workflow.

This is the design, not a failure. Every workflow carries `disable-model-invocation: true` (Claude)
and `allow_implicit_invocation: false` (Codex), so resembling a workflow never activates it. Invoke
explicitly: `/agent-os:<skill>` on Claude Code, `$<skill>` on Codex. The
[non-invocation eval cases](/reference/evals) exist precisely to keep naive phrasings from
triggering workflows implicitly.

The automatic disciplines are the opposite: they need no invocation and activate from the
situation. If a discipline seems inert, check that the plugin version is current (first section)
before assuming the trigger failed.
