# dispatch-next

**Bucket:** workflow · **Invocation:** manual · `/agent-os:dispatch-next` or `$dispatch-next`

Reads a repository's live GitHub state and selects exactly one decision-ready next action. One run,
one decision. The dispatcher chooses work; it never does the work.

Use it for queue and dispatcher sessions. Do not use it for ordinary tasks, or for anything that needs
a product or planning decision.

## Steps

1. **Learn the local contract.** Read the repo's project policy and `CLAUDE.md`/`AGENTS.md` for queue
   rules, labels, lanes and roles. The contract lives in the repository — this skill hardcodes no
   repo-specific labels or role names.
2. **Read live state:** open issues, open PRs, CI status, using read-only commands only.
3. **Prioritize work in flight first.** An open PR awaiting review or a red CI run outranks starting
   anything new.
4. **Select exactly one target.** Route an open map decision ticket to
   [`chart-work`](/skills/chart-work), a graduated branch to [`shape-work`](/skills/shape-work), and
   only decision-complete implementation to [`deliver-work`](/skills/deliver-work). A captured spawned
   issue stays ordinary backlog until it is separately prioritized — capture is not dispatch.
5. **Output one decision:** the target, the motivation, the proposed role and the proposed next
   action. Nothing else.

## Modes

**Shadow** is the default. The decision is the entire output: no labels changed, no comments, no PRs
opened or edited, no merges, no issues closed, no workers started.

**Non-shadow** applies only when the project policy or the session explicitly allows it. Then at most
one worker may be started for the selected target, and nothing else.

## Hard rules

Shadow mode permits only reading GitHub commands — `gh issue list/view`, `gh pr list/view`,
`gh run list/view`, and `gh api` with GET. Every mutating verb (`edit`, `comment`, `close`, `merge`,
`create`, POST, PATCH, DELETE) is out of bounds, because the command log of a shadow run is the
acceptance evidence and it must contain zero mutations.

Exactly one target per run — a dispatcher that picks two has decided nothing.

If no decision-ready work exists, that is the decision. Report it, with the closest blockers and what
would unblock them.

The dispatcher never implements, reviews or fixes anything itself. Proposing a role for the work is
where its job ends.
