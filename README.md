# agent-os

A lightweight agent operating system: Agent Skills shared between Claude Code and Codex, with
ceremony proportional to the work. It ships as two packages from one source:

- **`agent-os-core`** (`plugins/agent-os-core`) holds intent, planning, explanation, scope, evidence,
  and lesson skills. It is useful for product, documentation, and analysis work as well as code.
- **`agent-os-dev`** (`plugins/agent-os-dev`) holds delivery, review, testing, simplification, and
  setup skills plus the hooks that enforce them. It requires `agent-os-core`.

**Documentation: [sockulags.github.io/agent-os](https://sockulags.github.io/agent-os/)**

## Skills

Decisions that outlive a session live in versioned files: `intents/<id>/intent.md` for what is needed
and why, `spec.md` for behavior, boundaries, and ground truth, and `plan.md` for delivery units. A
small fix needs none of them. See the
[intent file reference](https://sockulags.github.io/agent-os/reference/intents).

### agent-os-core

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| `capture-intent` | workflow | manual | Capture the need behind a wish as a versioned intent |
| `plan-work` | workflow | manual | Plan a mission and write it as a versioned spec |
| `explain-work` | workflow | manual | Explain or shorten work in plain language |
| `list-skills` | meta | manual | List installed skills and how to invoke them |
| `scope-guard` | discipline | automatic | Keep work inside the task; flag drift |
| `verify-before-done` | discipline | automatic | Fresh evidence before any completion claim |
| `plain-voice` | discipline | automatic | Apply plain voice to documentation, commits, and pull request text |
| `record-lesson` | discipline | automatic | Notice a correction and record the durable lesson behind it |

### agent-os-dev

| Skill | Bucket | Invocation | Purpose |
|---|---|---|---|
| `shape-work` | workflow | manual | Shape a spec into delivery units in plan.md or tracker issues |
| `deliver-work` | workflow | manual | Deliver one unit against its contract and claim it with a draft pull request |
| `batch-work` | workflow | manual | Run isolated ready units and verify the integrated result |
| `dispatch-next` | workflow | manual | Pick or dispatch one action according to the request |
| `simplify` | workflow | manual | Review, audit, or remove unnecessary code and solution layers |
| `init-agent-os` | workflow | manual | Managed policy setup or repository defaults |
| `check-work` | workflow | automatic | Independently review a candidate and report or fix supported findings |
| `diagnose-before-fix` | discipline | automatic | Reproduce and root-cause before patching |
| `proportional-testing` | discipline | automatic | Minimum meaningful regression coverage |
| `quality-ratchet` | discipline | automatic | Compare exact entry and candidate evidence without score gates |

Manual skills carry `disable-model-invocation: true` (Claude) and `agents/openai.yaml` with
`policy.allow_implicit_invocation: false` (Codex). Automatic skills carry neither gate; their
descriptions define when they trigger, and they may still be explicitly named. Retired skills move to
root `deprecated/`, outside both plugin roots, so they are never distributed. The maintainer doctrine
for writing skills lives in `.agents/skills/writing-skills` and is not distributed either.

## Install

### Guided npm installer

The recommended setup is a guided command that asks which host skill directories to configure,
which packages to install, and whether to sync the shared global policy:

~~~bash
npx @sockulags/agent-os install
~~~

It supports Codex, Claude Code, or both without requiring either host CLI. By default it copies the
skills of both packages into the selected user-level directories (`~/.codex/skills` and/or
`~/.claude/skills`). For a non-interactive install, make the choices explicit:

~~~bash
npx @sockulags/agent-os install --platform both --scope user --yes
npx @sockulags/agent-os install --platform claude --package core --yes
~~~

`--package all` (the default) installs core and dev; `--package core` installs only the core skills,
adds no hooks, and installs the global policy without its development section.

To refresh an existing installation:

~~~bash
npx @sockulags/agent-os update
npx @sockulags/agent-os update --platform codex --no-policy
~~~

Updates replace only skill directories recorded in `.agent-os-install.json` and preserve unrelated
skills. Retired skills recorded there are removed. Use `--scope project` to install into the current
project's skill directories. The first command always downloads the current npm CLI; use
`npx @sockulags/agent-os@latest update` to force the newest published installer.

Direct Claude skills appear as `/<skill>` and direct Codex skills as `$<skill>`.

### Hooks

With agent-os-dev, direct installation merges three managed hooks into the selected host
configuration without replacing unrelated hooks: the quality-ratchet `Stop` gate and the
`SessionStart` and `PreToolUse` guard hooks. The user and project paths are
`~/.claude/settings.json` or `<project>/.claude/settings.json` for Claude Code, and
`~/.codex/hooks.json` or `<project>/.codex/hooks.json` for Codex. Plugin installs load the same hooks
from `plugins/agent-os-dev/hooks/hooks.json`. Node must be available to native plugin hooks. The
packaged hooks keep one logical command source: Claude and Unix-like Codex use
`${CLAUDE_PLUGIN_ROOT}`, while Windows Codex uses a quote-free `commandWindows` with a UTF-16LE
PowerShell `-EncodedCommand` payload that resolves `$env:PLUGIN_ROOT` at runtime.

The guard hooks read `.agent-os/guards.json` and do nothing where it is absent. They name the intent
behind the current branch and any stale spec or plan at session start, and block edits to protected
paths, edits to accepted intents and specs during delivery, edits to a test locked with
`guards.mjs lock-test`, and a `git commit` that adds a likely secret. They never run a command the
repository declares. See the [guard hook reference](https://sockulags.github.io/agent-os/reference/guards).

The ratchet begins an exact worktree- and host-session-local baseline before the first mutation when `deliver-work`
can run it, checks the candidate before `simplify` review mode, and reports source-file/NLOC,
legacy-before/after, dependency, and optional-analyzer evidence. These are signals for semantic
judgment, not score or raw-count thresholds. With lizard installed it adds cyclomatic complexity
before and after for touched functions; missing lizard is reported as unavailable, never clean. A Stop hook blocks a missing, corrupt, or stale active lifecycle check until the same
host session records a fresh check. Declare the delivery ground truth as a `required` check in
`.agent-os/quality.json`; it runs only after the developer trusts the repository's controls. A
passing check lets the turn end and keeps the baseline, so a
delivery that pauses to ask the developer still compares against the exact entry state; `finish`
closes the baseline only after a passing check. Every block except corrupt state is bounded: after
three re-entries on the unchanged candidate the hook releases the stop to the user and keeps delivery
blocked. Without a
baseline for the current host session it is a no-op. Resolve
`scripts/quality-delta.mjs` relative to the installed `quality-ratchet/SKILL.md` and run its `clear`
command from that same host session to abandon an active attempt. Standalone/manual use without a
host session ID uses a deterministic fallback state. `begin`, `check`, `finish`, and `clear` read the host ID
from `CODEX_THREAD_ID` or `CLAUDE_CODE_SESSION_ID`, with Codex taking precedence when both exist;
native Stop resolves the same identity from its `session_id` payload, using non-empty `turn_id` to
identify Codex. There is no uninstall command yet.

### Doctor and lint-intents

`npx @sockulags/agent-os@latest doctor` is a read-only report of every installed version and package,
retired or missing skills, duplicate direct and plugin installs, an old single `agent-os` plugin that
must be replaced by `agent-os-core` and `agent-os-dev`, the global policy blocks (each carries an
`<!-- agent-os version X -->` line), and the hooks, with the command that fixes each difference.
Team update, migration, governance, and removal steps are in the
[team setup guide](https://sockulags.github.io/agent-os/guide/team-setup).

`npx @sockulags/agent-os lint-intents` checks `intents/<id>/` files: frontmatter, statuses,
`built_on` revisions, unit lines, and unique ids. Stale specs and plans are warnings, or errors with
`--strict`. With `--base <ref>` it also fails when an accepted file's text changed without a higher
`rev`; `--allow-unchanged-rev` accepts a pure wording fix.

### Plugins

Native marketplace installation remains available with `--method plugin`. It requires the selected
host CLI and installs `agent-os-core` and `agent-os-dev` (or only core with `--package core`). Claude
plugin skills appear as `/agent-os-core:<skill>` and `/agent-os-dev:<skill>`; Codex plugin skills
remain `$<skill>`.

For development against this clone, Claude can use `claude --plugin-dir plugins/agent-os-core
--plugin-dir plugins/agent-os-dev`, and Codex can register the local `.agents/plugins/marketplace.json`
marketplace.

## Release routine

1. Run `node scripts/validate-agent-os.mjs`, `npm test`, its red-case suite, and `npm run test:evals`.
2. Bump `version` in both packages' `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`
   under `plugins/`, and in `package.json`.
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
name. A skill edit and its documentation page are one change: the pages under `skills/` and
`reference/` mirror the skill files and go stale first.

## Evals

- `evals/cases/` — versioned trigger and behavior cases plus `manifest.json`, which indexes at least
  2 positive and 2 negative cases per skill.
- `evals/RESULTS.md` — historical forward-test results. New results evaluate observable contracts,
  not approval ceremony or reasoning traces.
- `evals/behavior/` — runner-independent behavior cases, normalized run records, deterministic
  scorecard graders, and explicit human/model judgments.
- `evals/runners/` — thin Promptfoo and Inspect AI adapters around the Agent OS scorecard.
- `evals/runs/` — raw logs, gitignored.

## Experiments

Experimental work is kept outside the installable package until evidence supports promotion. The
first recorded Codex experiment replaces a large shared GPT-5.6 prompt with smaller
risk-calibrated core and Auto Review prompts, including exact text, eval evidence, local
installation, and rollback:

- [Codex custom instructions](https://github.com/sockulags/agent-os/blob/main/experimental/codex/custom_instructions.md)

## Global policy

`policy.md` is the source of truth. The npm installer and `init-agent-os global` install it as a
managed block (`<!-- BEGIN/END AGENT OS -->`) in `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md`. Edit `policy.md`, never the installed blocks. Everything above its
`## Development workflows` heading is the core policy; that section is installed only with
agent-os-dev. `plugins/agent-os-dev/skills/init-agent-os/policy.md` is a copy that the validator keeps
identical, so a plugin install can find the source.
