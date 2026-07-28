# Work records

`deliver-work` keeps its state on disk, not in the conversation. Tracked work lives in
`.agent-os/work/<slug>.md`, and the frontmatter of that file is the durable cursor.

```yaml
---
agent_os_work: 1
title: <work title>
mode: tracked
status: awaiting-approval
next_step: steps/03-checkpoint.md
baseline_sha: ""
review_target: ""
review_loop_iteration: 0
---
```

## The state machine

Allowed forward states are:

```text
awaiting-approval → approved → implementing → in-review → reviewed → verified → delivered
```

`blocked` is used only together with `blocked_from`, `next_step` and a concrete reason.

A resumed run reads `next_step` and loads exactly that file. It never infers a later state from the
code or from the conversation — a repository that looks implemented does not mean the checkpoint was
approved, and green tests do not mean review happened.

## What each state guarantees

`awaiting-approval` means a plan exists and no product mutation has occurred. `approved` is the only
state in which product mutations may begin; planning artifacts and the work record itself are allowed
before it. `implementing` carries a `baseline_sha` captured before the first mutation. `in-review`
carries a frozen review target — the baseline, the exact changed and untracked file list, and a
SHA-256 snapshot hash — and no mutation is permitted until every independent report returns.

`reviewed` means every finding has a disposition, every out-of-scope follow-up records the user's
create-or-leave choice, and the receipt holds no unresolved blocker or decision. `verified` means
every acceptance criterion traces to fresh evidence of the matching class. `delivered` means the
requested delivery boundary was reached and evidenced.

## Body sections

A tracked work record carries the workflow frontmatter plus these sections: Intent, Non-goals,
Acceptance, Test seams, Intended mutations, Assumptions, Verification, Review receipt.

## One-shot work

One-shot work follows the same sequence in memory and creates no work record. If the run is
interrupted, it restarts from the readiness check — there is no cursor to resume from, which is the
tradeoff for skipping the artifact.

Classification is conservative: one-shot means clear intent, zero plausible blast radius, and no
product or architecture decision. Uncertainty selects tracked.

## Approval semantics

Product mutations begin only in `approved`. General requests to build, implement, finish or continue
are the task intent, not checkpoint approval. The one bypass is an invoking instruction that
explicitly says to run the whole workflow without a checkpoint, and that exact sentence gets recorded
in the work record so the bypass stays auditable.
