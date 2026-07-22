# Step 6: Verify

## Preconditions

Tracked work must have `status: reviewed`; one-shot work must have a complete review receipt. Otherwise `HALT`.

## Execute

1. Apply `verify-before-done` to the resulting candidate, not the pre-fix snapshot.
2. Run every planned verification plus all regression checks added during review.
3. Trace every acceptance criterion to fresh mechanical or observed evidence. User-visible, rendered, accessibility, external-system, or manual requirements need evidence of that exact class; substitute checks do not count.
4. Inspect the final diff against the approved mutation list and project policy. Resolve only in-scope failures; route changed intent back to the checkpoint.
5. Record commands, results, observed checks, final changed files, and remaining uncertainty. Set tracked work to `status: verified` and `next_step: steps/07-deliver.md` only when all required evidence passes.

## Completion criterion

Every completion claim has fresh matching evidence, the final scope matches approval, and no required check is missing or stale.

`NEXT`: read [07-deliver.md](07-deliver.md) completely.
