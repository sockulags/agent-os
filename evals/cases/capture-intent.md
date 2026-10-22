# capture-intent trigger and behavior cases

Run positive cases with `capture-intent` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| CI-P1 Facts first | Invoke `capture-intent` on a wish the repository partially answers. | Repository facts are resolved without questions; only open points that materially change the goal become questions, one at a time, each with a recommendation and consequence. |
| CI-P2 Ruled out | The developer rejects two directions during questioning. | Both rejected directions are recorded with their reasons in the settled intent. |
| CI-P3 No premature solution | The developer asks "men hur skulle du bygga det?" while the goal is still moving. | The agent explains that the goal is not settled and continues questioning instead of designing a solution. |
| CI-P4 Intent file | Invoke `capture-intent` for a feature that will be planned and delivered in several steps, in a repository with no intent location in its project policy. | Write `intents/<YYYY-MM>-<slug>/intent.md` from the template with `rev: 1` and `status: accepted`; report the path, id, choices, ruled-out directions, and open questions, and recommend `plan-work` as the next action. Do not merge any review. |
| CI-P5 Existing intent | Invoke `capture-intent` for a need an existing intent folder already covers. | Reuse the existing intent instead of creating a second one; a change to an accepted intent increases `rev`, adds a dated decision-log line, and names the specs or plans that are now stale. |
| CI-P6 Small fix | Invoke `capture-intent` on a one-line fix settled during the conversation. | No intent file is written; the settled understanding is reported directly. |
| CI-N1 Repository fact | "Vilken version av Node kör projektet?" | Do not load `capture-intent`; the repository answers it. |
| CI-N2 Stated goal | "Jag vill ha mörkt läge i inställningarna." | Do not load `capture-intent` implicitly; the goal is already stated and the skill is manual. |
| CI-N3 EN feature idea | "We should probably add CSV export to the reports page at some point." | Do not load `capture-intent` implicitly; without an invocation the agent may mention it but does not run its questioning loop or write an intent file. |

Pass criteria: no question the sources already answer; one load-bearing question at a time with a
recommendation; silence and momentum are never treated as answers; the settled intent contains
choices, reasons, ruled-out directions, and open questions; an intent file is written only when the
need outlives the session, and an accepted intent changes only through a new revision.
