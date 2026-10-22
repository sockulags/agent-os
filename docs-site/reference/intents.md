---
title: Intent, spec, and plan files
description: The versioned files that carry a need from intent through spec to delivery units, and how their revisions stay consistent.
---

# Intent, spec, and plan files

Decisions that outlive a session live in versioned files in the repository, next to the code they
govern. They change only through a reviewed pull request, like code, and Git is their history.

> The canonical templates agents load are
> [`intent-template.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-core/skills/capture-intent/references/intent-template.md),
> [`spec-template.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-core/skills/plan-work/references/spec-template.md),
> and the plan format in
> [`implementation-issues.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/shape-work/references/implementation-issues.md).

## Layout

```text
intents/
  2026-11-csv-export/
    intent.md   capture-intent: who needs what, why now, outcome, out of scope
    spec.md     plan-work: summary, behavior, boundaries, decisions, ground truth
    plan.md     shape-work: delivery units and dependencies
```

The folder name is the id: `<YYYY-MM>-<slug>` in lowercase kebab-case. `intents/` sits at the root of
the repository that owns the outcome. A project policy may name another location, such as a separate
product repository when work often spans several code repositories.

## Ceremony follows size

| Work | Files |
|---|---|
| A bug without a product question | none; the pull request carries the contract |
| A feature | `intent.md` and `spec.md` |
| An initiative with several pull requests | all three |

## Frontmatter

```markdown
---
id: 2026-11-csv-export
status: accepted
rev: 2
supersedes: null
---
```

```markdown
---
intent: 2026-11-csv-export
rev: 2
built_on: intent@2
status: accepted
---
```

```markdown
---
intent: 2026-11-csv-export
rev: 1
built_on: spec@2
status: accepted
source: files
---
```

| File | Statuses |
|---|---|
| `intent.md` | `accepted`, `done`, `superseded` |
| `spec.md` | `accepted`, `superseded` |
| `plan.md` | `accepted`, `done`, `superseded` |

A new file is written as `accepted`, because merging its review is the acceptance. A draft exists only
on its branch. Delivery progress is never written into these files. The pull request that delivers
the last unit sets the intent and plan to `done`. Extra keys, such as a tracker key, are allowed when
the project policy asks for them.

## Revisions and staleness

- `rev` starts at 1 and increases by one each time an accepted file changes meaning. The change adds
  a line to the file's `## Decision log` with the date, what changed, and why.
- `built_on` names the revision of the file this one answers: a spec is built on `intent@N`, a plan
  on `spec@N`. Revision numbers survive squash merges and rebases, which change commit SHAs.
- A file whose `built_on` revision is older than its source is stale. Stale is an open product
  question: shape-work does not shape from a stale spec, deliver-work does not deliver from a stale
  plan, and dispatch-next does not report them as ready.
- Approval is a merged pull request. `CODEOWNERS` decides who approves intents and specs; no approval
  is stored in frontmatter.
- A replaced intent gets `status: superseded`, and its replacement names it in `supersedes`.

## Units

```markdown
## Units

- [U1] Export endpoint
- [U2] Button in the report view — depends on U1
- [U3] Excel format — depends on U1 — blocked: which Excel versions to support

### U1 Export endpoint

Outcome: ...
Boundaries: ...
Acceptance: Behavior examples 1 to 3 in spec.md
Ground truth: npm test -- export
Delivery target: pull request
```

Each unit line is `- [<KEY>] <title>`, optionally followed by ` — depends on <KEY>, <KEY>` and
` — blocked: <reason>`. Keys never change once written. With `source: files`, each unit has a
`### <KEY> <title>` section with its contract. With `source: issues`, the keys are tracker keys, the
tracker issues hold the contract, and the plan holds only the list.

## Claims and status

A unit is claimed by a draft pull request whose body carries:

```text
Intent-Unit: 2026-11-csv-export/U2
```

A unit with an open pull request carrying its line is claimed, a unit whose pull request merged is
delivered, and a unit whose dependencies are delivered and whose line has no `blocked:` note is
ready. Status is read from pull requests, so parallel deliveries never conflict in `plan.md`.

## lint-intents

```bash
npx @sockulags/agent-os lint-intents
npx @sockulags/agent-os lint-intents --base origin/main --strict
```

It checks folder names, required files, frontmatter fields and statuses, `built_on` references,
`supersedes` targets, unique unit keys, and dependencies. Stale files are warnings, or errors with
`--strict`. With `--base <ref>` it also fails when an accepted file's text changed without a higher
`rev`; frontmatter-only changes, such as a status change or a confirmed `built_on`, need no new
revision. `--allow-unchanged-rev` accepts a pure wording fix, for example when a pull request carries
a `no-rev` label. [init-agent-os](/skills/init-agent-os) can add a `lint-intents` GitHub Actions
workflow that runs it on pull requests touching `intents/**`.
