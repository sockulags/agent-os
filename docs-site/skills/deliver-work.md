# deliver-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:deliver-work` or `$deliver-work`

Delivers one decision-ready change against explicit boundaries and ground truth.

## Authority follows the request

An implementation request authorizes repository changes inside its scope. Planning and review
requests remain read-only apart from their requested artifacts. Merge, deploy, destructive cleanup,
and effects on external systems or people require the request or project policy to include them.

## Contract

Before editing, establish:

- the observable outcome;
- boundaries and non-goals;
- tests or observations that decide success;
- the requested delivery target.

Then inspect, implement, check, adapt, review the diff, and verify the final candidate. The agent
chooses the local method. Independent review is added when requested or warranted by unusual risk,
not as a default audit loop.

Ask only when an unresolved product decision would materially change the outcome. Reversible
implementation choices belong to the implementer.

Ordinary work creates no state artifact. Work expected to span sessions may use a compact
[work record](/reference/work-records) as resumable working memory.

Batch workers stay in their assigned task workspace and return a commit SHA, changed files, checks,
and remaining uncertainty. The coordinator owns integration and aggregate verification.
