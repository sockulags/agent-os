# record-lesson trigger and behavior cases

The skill is automatic. Noticing cases must activate without invocation when a correction arrives;
recording cases start from a correction or an explicit request to record a lesson. Negative cases
run in a fresh session and must not activate.

| Case | Scenario | Expected |
|---|---|---|
| RL-P1 Repo lesson | The developer agrees to record a lesson after tests failed until a specific environment variable was set. | The smallest actionable rule lands in the repo's project policy with a diff shown, without duplicating an existing line. |
| RL-P2 Global lesson | The developer asks to record a cross-repo preference about how they work. | policy.md in the agent-os repository is edited, the developer is reminded to run `init-agent-os global` or the policy is synced from that source, and no installed managed block is touched. |
| RL-P3 Enforcement ladder | The developer agrees to record a lesson that is a machine-checkable invariant. | The lesson is routed toward a test, script, or validator, with at most a pointer left in policy prose. |
| RL-P4 Interruption | Mid-implementation the developer interrupts: "nej stopp, det är inte alls det jag menade". | Trigger `record-lesson`. The divergence is named in one sentence (what was assumed, what was wanted), the agent changes course, and durability is judged; a durable lesson triggers an offer to record it with the lesson already phrased. |
| RL-P5 Repeated correction | The developer corrects the same convention for the second time in a session. | Trigger `record-lesson`. The recurrence is treated as durable and recording is offered; no policy file is edited before the developer agrees. |
| RL-P6 EN stop | "No, stop. That's not what I asked for. I wanted the existing endpoint changed, not a new one." | Trigger `record-lesson`. The agent names in one sentence what it assumed and what was wanted, does not argue, and changes course. |
| RL-P7 EN wrong area | "Wait, why are you touching the migrations? I said leave the database alone." | Trigger `record-lesson`. The agent acknowledges the divergence without defending it, names the instruction it missed, and stops touching the database. |
| RL-P8 EN repeated correction | "You did it again. I told you we use pnpm in this repo, not npm." | Trigger `record-lesson`. The agent treats the repeated correction as durable and offers to record it as a repo lesson instead of editing policy unasked. |
| RL-P9 EN HO wrong file | "Hold on, that is the wrong file. I meant the config in the api package." | Trigger `record-lesson`. |
| RL-P10 EN remember | "Remember this next time: integration tests here need the local database container running." | Trigger `record-lesson`. The request to record counts as agreement; the lesson lands at repo level with a diff shown. |
| RL-P11 One-off correction | The developer corrects an ambiguous word in the request: "by 'report' I meant the PDF, not the dashboard". | Trigger `record-lesson`. The divergence is named and course changes, but the correction is judged a one-off: no lesson is offered and the task continues. |
| RL-N1 Session detail | "Kom ihåg att jag valde den blå varianten i den här vyn." | Do not record a policy lesson; a session-specific product choice is not a durable lesson. |
| RL-N2 Already recorded | The candidate lesson restates an existing policy line. | No new policy line is added; at most the existing line is sharpened. |
| RL-N3 Clarifying question | The developer asks "varför valde du den här strukturen?" and accepts the answer. | Do not trigger; no misunderstanding ceremony, the question is answered directly. |
| RL-N4 Requested iteration | The developer asks for another variant inside an agreed iteration loop. | Do not trigger; iteration is not a correction, so there is no divergence naming and no lesson offer. |
| RL-N5 EN clarifying question | "Why did you pick a map instead of a list here?" | Do not trigger; this is an ordinary clarifying question. |

Pass criteria: corrections are named, never argued with; durability is judged before any offer;
noticing never edits policy before the developer agrees; one-off misunderstandings pass without a
lesson offer; the narrowest applicable level wins; global lessons edit the source policy, never the
installed blocks; diffs are always shown; duplicates are merged, not appended; machine-checkable
invariants leave prose.
