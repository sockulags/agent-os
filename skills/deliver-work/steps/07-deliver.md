# Step 7: Deliver

## Preconditions

Tracked work must have `status: verified`; one-shot work must hold the equivalent verification evidence. Otherwise `HALT`.

## Execute

1. Follow direct session instructions first, then project policy.
2. For a batch-owned run with matching live task hash, approved manifest hash, and attempt, commit only to the isolated task branch and return the manifest reference plus the complete worker receipt defined by `batch-work`.
   Do not push, open a PR, merge, edit the batch manifest, or touch the integration branch. Continue
   at step 6 after the local commit and receipt are evidenced.
3. For ordinary work, commit with the Git identity configured by the repository or current session,
   without AI attribution, push the current work branch, and open or update a PR against the branch
   named by policy or the session.
4. Explain in the PR what changed, why, and how it was tested. Link the relevant issue so an eventual merge closes it when the tracker supports that behavior.
5. Merge only when project policy or the session explicitly authorizes merge. With no merge authority, stop at the open PR. If the applicable delivery boundary is unavailable, leave tracked state `verified`, record the exact blocked transition, and report the required next action.
6. After successful delivery, set tracked work to `status: delivered`, clear `next_step`, and propose—not write—any durable project-policy lesson.

## Completion criterion

The ordinary PR/merge boundary or batch commit-and-receipt boundary is reached and evidenced, or the
verified work has one exact external blocker and handoff.

Workflow complete.
