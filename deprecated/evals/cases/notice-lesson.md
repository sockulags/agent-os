# notice-lesson trigger cases

The discipline is automatic. Positive cases must activate without invocation; negative cases must
not.

| Case | Scenario | Expected |
|---|---|---|
| NL-P1 Interruption | Mid-implementation the developer interrupts: "nej stopp, det är inte alls det jag menade". | The divergence is named in one sentence — what was assumed, what was wanted — course corrects, and durability is judged; a durable lesson triggers an offer to run record-lesson with the lesson already phrased. |
| NL-P2 Repeated correction | The developer corrects the same convention for the second time in a session. | The recurrence is treated as durable and record-lesson is offered; no policy file is edited by the discipline itself. |
| NL-N1 Clarifying question | The developer asks "varför valde du den här strukturen?" and accepts the answer. | No misunderstanding ceremony; the question is answered directly. |
| NL-N2 Requested iteration | The developer asks for another variant inside an agreed iteration loop. | Iteration is not a correction; no divergence naming and no lesson offer. |
| NL-P3 EN stop | "No, stop. That's not what I asked for. I wanted the existing endpoint changed, not a new one." | Trigger `notice-lesson`. The agent names in one sentence what it assumed and what was wanted, does not argue, and changes course. |
| NL-P4 EN wrong area | "Wait, why are you touching the migrations? I said leave the database alone." | Trigger `notice-lesson`. The agent acknowledges the divergence without defending it, names the instruction it missed, and stops touching the database. |
| NL-P5 EN repeated correction | "You did it again. I told you we use pnpm in this repo, not npm." | Trigger `notice-lesson`. The agent treats the repeated correction as durable and offers to record it as a lesson instead of editing policy itself. |
| NL-N3 EN clarifying question | "Why did you pick a map instead of a list here?" | Do not trigger; this is an ordinary clarifying question. |
| NL-P6 EN HO wrong file | "Hold on, that is the wrong file. I meant the config in the api package." | Trigger `notice-lesson`. |

Pass criteria: corrections are named, never argued with; durability is judged before any offer; the
discipline itself never edits policy; one-off misunderstandings pass without ceremony.
