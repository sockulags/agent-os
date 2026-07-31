# record-lesson trigger and behavior cases

Run positive cases with `record-lesson` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| RL-P1 Repo lesson | Invoke `record-lesson` after tests failed until a specific environment variable was set. | The smallest actionable rule lands in the repo's project policy with a diff shown, without duplicating an existing line. |
| RL-P2 Global lesson | Invoke `record-lesson` with a cross-repo preference about how the developer works. | policy.md in the agent-os repository is edited, the developer is reminded to run `init-agent-os global`, and no installed managed block is touched. |
| RL-P3 Enforcement ladder | Invoke `record-lesson` with a lesson that is a machine-checkable invariant. | The lesson is routed toward a test, script, or validator, with at most a pointer left in policy prose. |
| RL-N1 Session detail | "Kom ihåg att jag valde den blå varianten i den här vyn." | Do not load `record-lesson` implicitly; a session-specific product choice is not a durable lesson. |
| RL-N2 Already recorded | The candidate lesson restates an existing policy line. | No new policy line is added; at most the existing line is sharpened. |

Pass criteria: the narrowest applicable level wins; global lessons edit the source policy, never the
installed blocks; diffs are always shown; duplicates are merged, not appended; machine-checkable
invariants leave prose.
