# Calibrate findings and resolution

A blocking finding needs a location, triggering condition, concrete consequence, and evidence that
the candidate fails a requirement or imposes a material maintenance cost. Security and data-loss
risks need a credible path, not a production incident. Duplicated rules that can diverge or mixed
responsibilities that make the requested behavior unsafe to change can justify simplification;
line count, personal style, and an equally valid design alternative cannot.

Separate required corrections from useful nonblocking follow-ups. Omit cosmetic preferences and
speculative hardening. No findings is a valid result. Do not manufacture work to justify review.

The implementer adjudicates each finding against the request, source, tests, and project policy:
fix supported in-scope problems; reject unsupported or equivalent-design requests with a concise
reason; route actionable adjacent work through `scope-guard`. A reviewer need not approve a
preference rejection, but scope cannot excuse a failing required check, broken acceptance
criterion, or material defect introduced by the candidate. Resolve the defect or report the blocker.

Re-review checks the accepted fixes and their plausible regressions. Reopen the broader review only
when the patch changed the broader surface. A newly discovered material defect still matters;
repeated preferences do not restart the loop. Escalate only an unresolved material decision, not
disagreement for its own sake.

Use `CHANGES_REQUESTED` for remaining supported required corrections, `BLOCKED` when necessary
evidence or a material decision is unavailable, and `APPROVED` when review is complete with neither.
Nonblocking follow-ups alone do not prevent approval. Report rejected findings and the reason when
they affected the review outcome; do not claim the reviewer agreed if the implementer rejected them.
