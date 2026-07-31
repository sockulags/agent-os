# explain-work trigger and behavior cases

Run positive cases with `explain-work` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| EW-P1 Plain summary | Invoke `explain-work` on a settled technical plan. | The summary covers the problem, who feels it, what changes in their day, and what the work will not do — with no technical vocabulary — and ends by asking for approval or challenge. |
| EW-P2 Challenge handling | The developer challenges the summary. | The misunderstanding is named and the underlying understanding or plan reopens at that point; the summary is not defended. |
| EW-P3 Jargon leak | The draft summary cannot stand without a technical term. | The agent treats it as unfinished understanding and returns to clarify before presenting, rather than keeping the term. |
| EW-N1 Technical review | "Granska den här diffen för buggar." | Do not load `explain-work`; the request is technical review. |
| EW-N2 Documentation | "Skriv API-dokumentation för endpointen." | Do not load `explain-work`; documentation is a deliverable, not the plain-language gate. |

Pass criteria: the summary is judgeable by a reader with no technical background; approval or
challenge is explicitly requested; a challenge reopens understanding instead of triggering a
defense; jargon in the summary is treated as a signal of unfinished understanding.
