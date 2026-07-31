# agent-os

A lightweight personal agent operating system — an Agent Skills framework shared between
Claude Code and Codex. One skill source, two platforms, ceremony proportional to the work.

**Documentation: [sockulags.github.io/agent-os](https://sockulags.github.io/agent-os/)**

## Skills

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| `init-agent-os` | workflow | manual | Managed policy setup or repository defaults |
| `chart-work` | workflow | manual | Chart broad work as a parallel graph of decision tickets |
| `shape-work` | workflow | manual | Turn bounded choices into implementation-ready issues |
| `batch-work` | workflow | manual | Run isolated ready units and verify the integrated result |
| `deliver-work` | workflow | manual | Implement one change against boundaries and ground truth |
| `dispatch-next` | workflow | manual | Pick or dispatch one action according to the request |
| `verify-before-done` | discipline | automatic | Fresh evidence before any completion claim |
| `diagnose-before-fix` | discipline | automatic | Reproduce and root-cause before patching |
| `scope-guard` | discipline | automatic | Keep work inside the task; flag drift |
| `writing-skills` | meta | manual | Doctrine and definition of done for agent-os skills |

Manual skills carry `disable-model-invocation: true` (Claude) and `agents/openai.yaml` with
`policy.allow_implicit_invocation: false` (Codex). Retired skills move to root `deprecated/`
(outside the plugin's `skills/`, so they are never distributed).

## Install

**Claude Code (development):** from the repository root, run `claude --plugin-dir .`, then reload with `/reload-plugins`.

**Claude Code (production):** add this repo as a personal marketplace, then install the `agent-os` plugin. Skills appear as `/agent-os:<skill>`.

**Codex (development & production):** local repo marketplace via `.agents/plugins/marketplace.json`; install copies to the Codex cache — refresh/reinstall and start a new session after changes. Skills appear as `$<skill>`.

## Release routine

1. Run `node scripts/validate-agent-os.mjs`, its red-case suite, and the live evals in `evals/`.
2. Bump `version` in **both** manifests (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`).
3. Commit with the Git identity configured by the repository or current session, without AI attribution, and push.
4. Update the plugin on both platforms; verify the new version loaded.

## Documentation site

`docs-site/` is a [VitePress](https://vitepress.dev) site published to GitHub Pages by
`.github/workflows/docs.yml` on every push to `main` that touches `docs-site/**`.

```bash
npm --prefix docs-site install
npm --prefix docs-site run dev
```

The base path in `docs-site/.vitepress/config.mjs` is `/agent-os/` and must match the repository
name. A skill edit and its documentation page are one change — the pages under `skills/` and
`reference/` mirror the skill files and go stale first.

## Evals

- `evals/cases/` — versioned trigger and behavior cases plus `manifest.json`, which indexes at least
  2 positive and 2 negative cases per skill.
- `evals/RESULTS.md` — historical forward-test results. New results evaluate observable contracts,
  not approval ceremony or reasoning traces.
- `evals/runs/` — raw logs, gitignored.

## Global policy

`policy.md` is the source of truth. `init-agent-os global` installs it as a managed block
(`<!-- BEGIN/END AGENT OS -->`) in `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` via
`skills/init-agent-os/scripts/policy-block.ps1`. Edit `policy.md`, never the installed blocks.
