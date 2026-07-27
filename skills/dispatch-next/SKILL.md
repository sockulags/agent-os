---
name: dispatch-next
description: Reads a repo's live GitHub state and selects exactly one decision-ready next action. User-invoked for queue and dispatcher work; shadow (read-only) is the default mode. Not for ordinary tasks or anything needing product or planning decisions.
disable-model-invocation: true
---

# dispatch-next

One run, one decision. The dispatcher chooses work; it never does the work.

## Steps

1. **Learn the local contract.** Read the repo's project policy and `CLAUDE.md`/`AGENTS.md` for queue rules, labels, lanes, and roles. The contract lives in the repo — this skill hardcodes no repo-specific labels or role names.
2. **Read live state**: open issues, open PRs, CI status — using read-only commands only (see hard rules).
3. **Prioritize work in flight first.** An open PR awaiting review or a red CI run outranks starting anything new.
4. **Select exactly one target.** Route an open map decision ticket to `chart-work`, a graduated
   branch to `shape-work`, and only decision-complete implementation to `deliver-work`. A captured
   spawned issue stays ordinary backlog until separately prioritized; capture is not dispatch.
5. **Output one decision**: the target, the motivation, the proposed role, and the proposed next action. Nothing else.

## Modes

- **Shadow (default)**: the decision is the entire output. No labels changed, no comments, no PRs opened or edited, no merges, no issues closed, no workers started.
- **Non-shadow**: only when the project policy or the session explicitly allows it — then at most one worker may be started for the selected target, and nothing else.

## Hard rules

- Shadow mode permits only reading GitHub commands: `gh issue list/view`, `gh pr list/view`, `gh run list/view`, `gh api` with GET. Every mutating verb (`edit`, `comment`, `close`, `merge`, `create`, POST/PATCH/DELETE) is out of bounds — the command log of a shadow run must contain zero mutations, because the log is the acceptance evidence.
- Exactly one target per run — a dispatcher that picks two has decided nothing.
- If no decision-ready work exists, that is the decision: report it, with the closest blockers and what would unblock them.
- The dispatcher never implements, reviews, or fixes anything itself — proposing a role for the work is where its job ends.
