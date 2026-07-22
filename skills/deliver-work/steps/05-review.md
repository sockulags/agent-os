# Step 5: Review

## Preconditions

Tracked work must have `status: implementing` and a matching review-target hash. One-shot work must have a frozen in-memory target. Drift returns to Step 4.

## Execute

1. Set tracked work to `status: in-review` and keep `next_step: steps/05-review.md` until review completes.
2. Read [../references/review-loop.md](../references/review-loop.md) completely and select its proportional depth.
3. Run the required independent reviewers against the same frozen target. Keep every reviewer read-only and isolated from implementer rationale and other reports.
4. Classify evidence, send only validated findings to one fixer, rerun affected checks, and allow at most one targeted re-review.
5. Write the review receipt into the work record, or retain the same fields for the one-shot final report.
6. Set tracked work to `status: reviewed` and `next_step: steps/06-verify.md` only when the receipt has no unresolved blocker or decision.

## Completion criterion

Every finding has a disposition, accepted findings are fixed and checked, and the review receipt names the frozen target, roles, classifications, fixer result, and re-review result.

`NEXT`: read [06-verify.md](06-verify.md) completely.
