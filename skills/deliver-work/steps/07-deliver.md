# Step 7: Deliver

## Preconditions

Tracked work must have `status: verified`; one-shot work must hold the equivalent verification evidence. Otherwise `HALT`.

## Execute

1. Follow direct session instructions first, then project policy.
2. Commit with the Git identity configured by the repository or current session, without AI attribution, push the current work branch, and open or update a PR against the branch named by policy or the session.
3. Explain in the PR what changed, why, and how it was tested. Link the relevant issue so an eventual merge closes it when the tracker supports that behavior.
4. Merge only when project policy or the session explicitly authorizes merge. With no merge authority, stop at the open PR.
5. If commit, remote, or PR delivery is unavailable, leave tracked state `verified`, record the exact blocked transition, and report the required next action.
6. After successful delivery, set tracked work to `status: delivered`, clear `next_step`, and propose—not write—any durable project-policy lesson.

## Completion criterion

The requested delivery boundary is reached and evidenced, or the verified work has one exact external blocker and handoff.

Workflow complete.
