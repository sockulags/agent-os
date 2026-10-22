---
title: The work loop
description: Carry a need from intent through spec, plan, delivery, review, and lesson, with ceremony that follows the size of the work.
---

# The work loop

Enter at the lowest step that still has unresolved work, and leave out the steps a small change does
not need.

<figure class="agent-os-diagram">
  <a href="/diagrams/agent-os-planning-delivery-flow.svg" target="_blank" rel="noopener" aria-label="Open the Agent OS planning and delivery flow at full size">
    <img class="diagram-light" src="/diagrams/agent-os-planning-delivery-flow.svg" alt="">
    <img class="diagram-dark" src="/diagrams/agent-os-planning-delivery-flow-dark.svg" alt="">
  </a>
  <figcaption>Uncertainty determines the planning entry point. The developer's explicit selection determines whether delivery runs one ready unit or a batch. The diagram predates the intent files. Select the diagram to open it at full size.</figcaption>
</figure>

## The steps

| Step | Skill | File | Who approves |
|---|---|---|---|
| Intent | `capture-intent` | `intents/<id>/intent.md` | the product owner merges the pull request |
| Spec | `plan-work` | `intents/<id>/spec.md` | product owner and tech lead merge |
| Plan | `shape-work` | `intents/<id>/plan.md`, or tracker issues | tech lead, or no extra gate for a small plan |
| Deliver | `deliver-work`, `batch-work` | code, tests, a draft pull request per unit | the developer steers |
| Review | `check-work`, `simplify` | `REVIEW.md`, the pull request review | a person approves the pull request |
| Lesson | `record-lesson` | the project policy | the developer agrees to each lesson |

Each file is versioned in Git and changes only through a pull request. A spec names the intent
revision it answers, and a plan names the spec revision, so a changed intent marks everything built
on it as stale until it is reconsidered. See [Intent, spec, and plan files](/reference/intents).

## Ceremony follows size

| Work | Steps |
|---|---|
| A bug without a product question | deliver, review, lesson |
| A feature | intent, spec, deliver, review, lesson |
| An initiative with several pull requests | every step |

Use `capture-intent` when a need is new or still moving. Use `plan-work` when behavior, decisions, or
ground truth need settling; it chooses its own depth, from a small outcome contract to a decision map
with canonical tickets. Use `shape-work` to write coherent delivery units. Use `deliver-work` for one
ready unit or an explicitly authorized set. Use `batch-work` only when the developer explicitly
chooses integrated execution of several ready units. `explain-work` writes the plain-language summary
at the top of the spec, and shortens any explanation that says too much.

For a diff, commit, branch, pull request, or completed implementation, `check-work` independently
reviews the candidate against the spec and `REVIEW.md`. It reports findings by default for an
implicit “review this” request; “review and fix this” authorizes its fix mode; `check-work ci` runs
headless on every pull request in the `agent-review` workflow. `simplify` reviews a diff, audits a
repository, or removes unnecessary code when asked.

Each workflow inherits the same authority rule: the request governs what happens. Planning requests
produce planning artifacts. Execution requests may mutate repository files in scope. Delivery stops
at the requested or policy-defined boundary.

## Underneath: disciplines and hooks

The automatic disciplines run in every session, and agent-os-dev pairs the important ones with
[guard hooks](/reference/guards):

- `scope-guard` classifies discoveries against the mandate; an accepted spec is part of the
  boundary, and the guard hook blocks edits to it during delivery;
- `diagnose-before-fix` establishes a supported cause and commits the failing test first; the guard
  hook keeps that test locked until the fix passes;
- `quality-ratchet` records exact entry and candidate evidence; its Stop hook blocks a turn that ends
  with a stale check or a failed required check from `.agent-os/quality.json`;
- `verify-before-done` matches completion claims to fresh evidence;
- `proportional-testing` picks the smallest test set that still guards the change;
- `record-lesson` treats corrections as misunderstanding signals and offers to keep the durable ones.

Status is never written into the files during delivery. A draft pull request with
`Intent-Unit: <intent-id>/<unit-key>` claims a unit, so several people can deliver units of the same
plan in parallel without conflicts.

## Worked example: filtered CSV export

The journey begins before the request exists:

> Reports feel useless for our big customers and I don't know what to do about it.

### 1. capture-intent writes the intent

`capture-intent` questions out the need: the pain is not seeing the data but taking it along, since
customers paste screenshots into slides today. It writes `intents/2026-11-csv-export/intent.md` with
`rev: 1` and opens a pull request that the product owner merges.

### 2. plan-work writes the spec

`plan-work` checks the real report flows. Three questions are owned and evidenced independently, so
it uses a small decision map:

| Ticket | Question | Evidence | Decision |
|---|---|---|---|
| EXP-1 | What is exported? | Current filter model and support requests | CSV of the active filtered result |
| EXP-2 | Who may export? | Existing report authorization tests | Reuse report-view permission |
| EXP-3 | What counts as large? | Production row-count sample | Synchronous through 10,000 rows; larger exports are out of scope |

The result is `spec.md` built on `intent@1`. Its summary, written by `explain-work`, reads:

> Large customers can already find the numbers they need, but the only way to take them along is a
> screenshot. This work gives them a proper way to take a filtered result with them. It will not
> change what they can see, only what they can carry away.

### 3. shape-work writes the plan

```markdown
## Units

- [U1] Export endpoint with authorization
- [U2] Download action with loading and error states
- [U3] End-to-end download check — depends on U1, U2
```

Each unit has its own section with outcome, boundaries, the spec examples it satisfies, and ground
truth such as an API contract test, a rendered download flow, and an unauthorized request test.
**Ground truth** is the observation that can decide the claim. “The build passes” is not ground truth
for a browser download.

### 4. deliver-work claims and delivers

Two developers take U1 and U2 at the same time. Each `deliver-work` run opens a draft pull request
with `Intent-Unit: 2026-11-csv-export/U1` or `/U2`, so `dispatch-next` shows both as claimed. The
ground truth runs as a required check in `.agent-os/quality.json`:

```text
Command: npm test -- report-export
Exit: 0
Result: API, authorization, and CSV encoding cases pass.
```

If the developer explicitly asks for it, `batch-work` can run U1 and U2 in isolated workspaces
instead and integrate them before U3.

### 5. check-work reviews the pull request

The `agent-review` workflow runs `check-work ci` against `REVIEW.md` and the spec, and a person
approves. The pull request that delivers U3 also sets the intent and plan to `done`. Merge and
deployment remain outside the request unless the project policy includes them.

### 6. The intent changes

Halfway through, the product owner adds Excel. The intent gets `rev: 2` and a decision log line.
`lint-intents` and the SessionStart hook now report the spec as stale, and delivery from it stops
until `plan-work` writes spec revision 2 built on `intent@2`.
