# dispatch-next

**Bucket:** workflow · **Invocation:** manual · `/agent-os:dispatch-next` or `$dispatch-next`

Reads live project state and selects one decision-ready next action.

Read the repository's queue rules, open work, pull requests, and CI. Prioritize actionable work
already in flight, then choose one target and explain why it wins.

The request wording governs action:

- “What should I do next?” selects and reports without mutation.
- “Dispatch the next task” authorizes the state changes and one launch needed for that target.

Dispatch does not imply merge, closure, or unrelated tracker actions. If nothing is ready, report
the closest blocker.
