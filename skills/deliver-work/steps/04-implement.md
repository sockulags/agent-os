# Step 4: Implement

## Preconditions

Tracked work must have `status: approved`. One-shot work must hold the approved in-memory plan. Otherwise `HALT` without product mutation.

## Execute

1. Capture the current Git `HEAD` as `baseline_sha` before product mutation. For tracked work, set `status: implementing` and `next_step: steps/05-review.md`.
2. Load only the approved context and affected project conventions.
3. Work in vertical slices at the approved test seams: make the behavior red, add the smallest sufficient implementation, make it green, then continue. Apply `diagnose-before-fix` for bugs and `scope-guard` throughout.
4. Run narrow feedback checks during implementation. Finish every planned task and acceptance criterion; discoveries that change intent return to the checkpoint instead of expanding scope.
5. Self-review the complete diff and remove concrete defects.
6. Freeze one review target before independent review: record the baseline, exact changed/untracked file list, and a SHA-256 snapshot hash. No mutation is allowed until all independent reports return; recheck the hash first.

## Completion criterion

Every approved task and acceptance criterion is implemented, narrow checks pass, and one unchanged review target is recorded.

`NEXT`: read [05-review.md](05-review.md) completely.
