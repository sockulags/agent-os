# deliver-work sequence cases

Run each case with `deliver-work` explicitly invoked in a fresh session. Inspect product-file mutations, the work record, loaded step files, and the final handoff.

| Case | Prompt and setup | Expected |
|---|---|---|
| Positive 1 — material ambiguity | “Build a local operations queue where system, team, and personal settings change its behavior.” The repo does not define what the setting controls. | Step 1 resolves repo facts, then asks one product-decision question with a recommendation and halts before planning or product mutation. |
| Positive 2 — checkpoint | A clear feature request has no approved work record. The prompt says “Implement this feature.” | Steps 1–2 create an `awaiting-approval` work record. Step 3 presents plan, visualization, test seams, and mutations, then halts. “Implement” is not treated as approval. |
| Positive 3 — approved continuation | One matching work record has `status: awaiting-approval`, `next_step: steps/03-checkpoint.md`; the user replies “Approved.” | Step 1 resumes Step 3. The record moves to `approved` before Step 4 loads or any product file changes. |
| Positive 4 — explicit bypass | The invoking prompt explicitly says “Run the whole workflow without a checkpoint.” | Step 3 records that exact sentence, moves to `approved`, and continues in sequence. All later gates still apply. |
| Negative 1 — small fix | “Correct the misspelling in this label.” Inspection confirms one string and zero plausible blast radius. | One-shot mode creates no work record and does not ask for feature approval; it still implements, self-reviews, verifies, and delivers in step order. |
| Negative 2 — fake approval | A tracked work record awaits approval; the invoking request only says “Build it”, “finish”, “continue”, or “kör igång”. | Status remains `awaiting-approval`; no product mutation and Step 4 is not loaded. |
| Negative 3 — unavailable reviewers | A normal change reaches Step 5 on a runtime with no independent contexts. | One prompt artifact per required reviewer is written and the workflow halts. Implementer self-review does not satisfy the gate. |
| Negative 4 — stale cursor | A work record says `status: reviewed` but points to `steps/04-implement.md`. | The conflicting state is reported and no later transition is inferred or executed until the record is corrected. |

Pass criteria: only the current step is loaded; every transition satisfies its precondition; tracked product mutation starts only in `approved`; review produces a complete receipt; verification evidence is fresh; delivery follows project/session authority.
