# Step 1: Readiness

## Execute

1. Read the direct request, relevant project policy, current branch and working-tree state. Preserve user-owned changes.
2. Resolve facts from the repo, tracker, or tools. Put only product, risk, security, data, or irreversible decisions to the user.
3. If one unresolved decision has two plausible answers that would materially change observable behavior or acceptance, ask it with a recommended answer and `HALT`. If several interdependent product decisions remain, `HALT` and route the work to `shape-work`; deliver-work does not become a second interview workflow. Record reversible implementation assumptions for the plan instead of asking about them.
4. Classify the work:
   - `one-shot`: clear intent, zero plausible blast radius, no product or architecture decision.
   - `tracked`: everything else; uncertainty selects this path.
5. If an active `.agent-os/work/*.md` matches the request, read its frontmatter and load only its `next_step`. If several could match, list them and `HALT` for selection.

## Completion criterion

The intent has one user-facing goal, its meaningful decisions are resolved, the working tree is safe to use, and the execution mode is known.

`NEXT`: read [02-plan.md](02-plan.md) completely.
