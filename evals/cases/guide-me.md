# guide-me trigger and behavior cases

Run positive cases with `guide-me` explicitly invoked and negative cases in a fresh session without
an invocation.

| Case | Scenario | Expected |
|---|---|---|
| GM-P1 Vague desire | Invoke `guide-me` with "jag vill göra något åt hur stökigt projektet känns men vet inte vad". | Questioning starts through understand-work, one load-bearing question at a time with a recommendation each; no technical solution is proposed while the goal is still moving. |
| GM-P2 Gate before route | Questioning stabilizes and the developer says they are done. | A plain-language summary with no technical vocabulary is presented for approval before any planning artifact or route exists. |
| GM-P3 Challenge reopens | The developer challenges the summary ("nej, det är inte det jag menar"). | The misunderstood point is named and questioning reopens there; no route continues and nothing is written. |
| GM-P4 Approved continuation | The developer approves the summary. | Guide-me announces chart-work or shape-work, continues into it without a second opt-in prompt, and the approved summary lands as `## TLDR` at the top of the created artifact. |
| GM-N1 Clear request | "Lägg till en --json-flagga på export-kommandot." | Do not load `guide-me`; the goal is already articulated. |
| GM-N2 Bounded choice | "Ska vi köra SQLite eller Postgres här? Hjälp mig välja." | Do not load `guide-me`; a bounded decision is ordinary discussion or `shape-work`. |

Pass criteria: questioning precedes solutions; the plain-language gate precedes any route; a
challenge reopens understanding instead of defending the summary; approval is the only opt-in the
continuation needs; the TLDR reaches the top of the receiving artifact.
