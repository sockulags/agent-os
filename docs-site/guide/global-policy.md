# Global policy

`policy.md` in the repository root is the source of truth for how the agent behaves on your machine,
across every project. It is installed as a managed block into `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md` by [`init-agent-os global`](/skills/init-agent-os).

You edit `policy.md`. You never edit the installed blocks.

## Priority order

The policy opens by stating what wins when instructions conflict:

1. A direct user instruction in the current session.
2. The repository's project policy and the nearest `CLAUDE.md` or `AGENTS.md`.
3. The active explicit workflow — an invoked agent-os skill.
4. This global policy.

The direct request stays highest. Workflows interpret it; they do not add authority the developer did
not grant or remove authority already granted inside the request's scope.

## Core rules

The rules are deliberately few, and each is written to be observable rather than aspirational.

Authority follows the request. Inspection, planning, and review remain read-only apart from their
requested artifacts; implementation authorizes in-scope repository changes. Merge, deploy,
destructive cleanup, and external effects require the request or project policy to include them.

Evidence comes before claims. Scope and diffs stay narrow. Only unresolved product decisions that
materially change the outcome are escalated; reversible implementation choices stay with the
implementer.

Commits use the Git identity configured by the repository or the current session, and never carry AI
attribution or `Co-Authored-By` trailers. Responses follow the language the user is writing in, while
code, commits and technical artifacts stay English unless the project says otherwise.

The remaining rules govern how the agent writes. Lead with the outcome, so the first sentence answers
what happened or what was found. Shorten by leaving out what does not change the reader's next step,
not by compressing language into arrow chains or invented shorthand. Never make the reader
cross-reference a label invented earlier in the same text. Explanations belong in prose; tables are
for short enumerable facts. Tone tracks the topic, and when it is unclear whether a topic is serious,
it is.

The last core rule is the invocation rule: orchestration is opt-in, and the workflow skills are never
self-invoked.

## Preferences

The preferences section holds seed defaults that any project policy may override. Two are shipped:
UI feedback lands under roughly 250 ms and never blocks the next interaction, and a project keeps its
own design identity rather than imitating the look of a well-known app.

The third is structural: every repository keeps a living project policy covering useful delivery,
verification, design-system, planning, batch, and convention defaults. `init-agent-os` seeds it.

## How the block is installed

`skills/init-agent-os/scripts/policy-block.ps1` is the only writer. Its semantics are deliberately
narrow: add exactly one block when none exists, update only the text inside well-formed markers,
abort without mutating anything when the markers are duplicated or malformed, and never touch text
outside the block.

Run it in check mode to see drift without writing:

```powershell
pwsh skills/init-agent-os/scripts/policy-block.ps1 -Check
```

Check mode never writes. It exits `0` when the target is in sync, `1` on drift or a missing file, and
`2` when the markers are malformed — the same exit code the write path uses when it aborts. An empty
target file counts as "no block", and the block becomes the whole file.

Deterministic block handling is the reason a script exists here at all. Marker surgery is exactly the
kind of fragile operation that a prose instruction performs slightly differently every time.
