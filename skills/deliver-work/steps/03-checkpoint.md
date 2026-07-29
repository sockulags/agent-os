# Step 3: Checkpoint

## One-shot

Confirm the classification still has zero plausible blast radius. If true, mark the in-memory state `approved` and continue. If false, return to Step 2 as tracked work.

## Tracked work

Require an existing work record with `status: awaiting-approval`.

Approval exists only when either:

1. The user responds to the presented plan with explicit approval; or
2. the instruction that invoked this workflow explicitly says to run the whole workflow without a checkpoint. Record the exact bypass sentence in the work record.
3. A batch-owned launch matches every live identity, hash, attempt, baseline, scope, state, and
   delivery-boundary condition in Step 1, and the batch manifest records explicit approval of that
   aggregate manifest hash. Record the batch approval source and hash in the work record.

Requests merely to build, implement, complete, continue, or "kör igång" are the task intent, not checkpoint approval.

Without approval, present the plan, visualization, test seams, and intended mutations. Ask for approval or edits and `HALT`. Do not read the implementation step or make product mutations.

With approval, set `status: approved` and `next_step: steps/04-implement.md`. Batch approval applies
only to the exact frozen task and approved manifest hashes; it never transfers to a changed
definition or batch plan.

## Completion criterion

One-shot classification is reconfirmed, or tracked approval is explicit and auditable.

`NEXT`: read [04-implement.md](04-implement.md) completely.
