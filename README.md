# agent-os

A lightweight personal agent operating system — an Agent Skills framework shared between
Claude Code and Codex. One skill source, two platforms, ceremony proportional to the work.

**Documentation: [sockulags.github.io/agent-os](https://sockulags.github.io/agent-os/)**

## Skills

Reading order: the planning foundation (`shape-work`, then `chart-work`, which hands off into it),
the on-ramp in front of both (`guide-me`), the remaining workflows, then the component skills the
workflows compose (`understand-work`, `explain-work`), the disciplines, and the meta skills.

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| `shape-work` | workflow | manual | Turn bounded choices into implementation-ready issues |
| `chart-work` | workflow | manual | Chart broad work as a parallel graph of decision tickets |
| `guide-me` | workflow | manual | Guide a vague desire to an approved goal and into planning |
| `deliver-work` | workflow | manual | Implement one change against boundaries and ground truth |
| `batch-work` | workflow | manual | Run isolated ready units and verify the integrated result |
| `dispatch-next` | workflow | manual | Pick or dispatch one action according to the request |
| `init-agent-os` | workflow | manual | Managed policy setup or repository defaults |
| `record-lesson` | workflow | manual | Record a durable lesson in repo or global policy |
| `simplifier` | workflow | manual | Remove unnecessary code and solution layers |
| `simplifier-audit` | workflow | manual | Audit a repository for simplification opportunities |
| `understand-work` | workflow | manual | Question out the need behind a stated wish |
| `explain-work` | workflow | manual | Explain the task in plain language for approval |
| `verify-before-done` | discipline | automatic | Fresh evidence before any completion claim |
| `diagnose-before-fix` | discipline | automatic | Reproduce and root-cause before patching |
| `scope-guard` | discipline | automatic | Keep work inside the task; flag drift |
| `simplifier-review` | discipline | automatic | Review a diff for unnecessary complexity |
| `notice-lesson` | discipline | automatic | Treat interruptions as misunderstanding signals |
| `list-skills` | meta | manual | List installed skills and how to invoke them |
| `writing-skills` | meta | manual | Doctrine and definition of done for agent-os skills |

Manual skills carry `disable-model-invocation: true` (Claude) and `agents/openai.yaml` with
`policy.allow_implicit_invocation: false` (Codex). Retired skills move to root `deprecated/`
(outside the plugin's `skills/`, so they are never distributed).

## Install

### Guided npm installer

The recommended setup is a guided command that asks which host skill directories to configure and
whether to sync the shared global policy:

~~~bash
npx @sockulags/agent-os install
~~~

It supports Codex, Claude Code, or both without requiring either host CLI. By default it copies the
packaged skills into the selected user-level directories (`~/.codex/skills` and/or
`~/.claude/skills`). For a non-interactive install, make the choices explicit:

~~~bash
npx @sockulags/agent-os install --platform both --scope user --yes
~~~

To refresh an existing installation:

~~~bash
npx @sockulags/agent-os update
npx @sockulags/agent-os update --platform codex --no-policy
~~~

Updates replace only skill directories recorded in `.agent-os-install.json` and preserve unrelated
skills. Use `--scope project` to install into the current project's skill directories. The first
command always downloads the current npm CLI; use `npx @sockulags/agent-os@latest update` to force
the newest published installer.

Direct Claude skills appear as `/<skill>` and direct Codex skills as `$<skill>`.

Native marketplace installation remains available with `--method plugin`. It requires the selected
host CLI. Claude plugin skills appear as `/agent-os:<skill>`; Codex plugin skills remain
`$<skill>`.

For development against this clone, Claude can still use `claude --plugin-dir .`, and Codex can
register the local `.agents/plugins/marketplace.json` marketplace.

## Release routine

1. Run `node scripts/validate-agent-os.mjs`, `npm test`, its red-case suite, and the live evals in `evals/`.
2. Bump `version` in `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and `package.json`.
3. Add a dedicated changelog heading, commit and push, merge the green pull request to `main`, and
   create the matching tag before publishing. Never publish npm from a dirty worktree.
4. Pack the npm artifact and verify a clean direct install for both hosts, then publish it.
5. Create the non-draft GitHub Release, confirm the newest stable release is marked `Latest`, wait
   for Validate and Docs/Pages on current `main`, and run `node scripts/verify-release.mjs <version>`.
   A release is incomplete until source, npm, GitHub, changelog, and live docs all pass that gate.

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

`policy.md` is the source of truth. The npm installer and `init-agent-os global` install it as a
managed block (`<!-- BEGIN/END AGENT OS -->`) in `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md`. Edit `policy.md`, never the installed blocks.
