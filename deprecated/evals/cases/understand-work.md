# understand-work trigger and behavior cases

Run positive cases with `understand-work` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| UW-P1 Facts first | Invoke `understand-work` on a wish the repository partially answers. | Repository facts are resolved without questions; only open points that materially change the goal become questions, one at a time, each with a recommendation and consequence. |
| UW-P2 Ruled out | The developer rejects two directions during questioning. | Both rejected directions are recorded with their reasons in the settled understanding. |
| UW-P3 No premature solution | The developer asks "men hur skulle du bygga det?" while the goal is still moving. | The agent explains that the goal is not settled and continues questioning instead of designing a solution. |
| UW-N1 Repository fact | "Vilken version av Node kör projektet?" | Do not load `understand-work`; the repository answers it. |
| UW-N2 Stated goal | "Jag vill ha mörkt läge i inställningarna." | Do not load `understand-work` implicitly; the goal is already stated. |

Pass criteria: no question the sources already answer; one load-bearing question at a time with a
recommendation; silence and momentum are never treated as answers; the settled understanding
contains choices, reasons, ruled-out directions, and open questions.
