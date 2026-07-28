# Step 5: Review

## Preconditions

Tracked work must have `status: implementing` on first entry or `status: in-review` when resuming,
plus a matching review-target hash. One-shot work must have a frozen in-memory target. Drift returns
to Step 4.

## Execute

1. On first entry, set tracked work to `status: in-review`. On resume, continue from the reports,
   fixer results, and pending dispositions already recorded in the review receipt; do not repeat
   completed review work. Keep `next_step: steps/05-review.md` until review completes.
2. Read [../references/review-loop.md](../references/review-loop.md) completely and select its proportional depth.
3. Run the required independent reviewers against the same frozen target. Keep every reviewer read-only and isolated from implementer rationale and other reports.
4. Classify evidence, send only validated in-scope findings to one fixer, rerun affected checks, and allow at most one targeted re-review.
5. Collect all evidence-supported `out-of-scope-follow-up` findings from the completed review. Write their pending dispositions to the review receipt, present the issue candidates together, and HALT to ask whether to create issues for all, a selected subset, or none. Do not mutate the tracker before the answer.
6. Record each follow-up choice and finish the review receipt in the work record, or retain the same fields for the one-shot final report. Skip the question when no supported out-of-scope follow-up exists.
7. Set tracked work to `status: reviewed` and `next_step: steps/06-verify.md` only when the receipt has no unresolved blocker, decision, or unanswered follow-up choice.

## Completion criterion

Every finding has a disposition, every out-of-scope follow-up records the user's create-or-leave
choice, accepted findings are fixed and checked, and the review receipt names the frozen target,
roles, classifications, fixer result, and re-review result.

`NEXT`: read [06-verify.md](06-verify.md) completely.
