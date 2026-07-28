# Project policy

Every repository keeps its own living policy. It is the reason the workflow skills contain no
repository-specific labels, branch names or merge rules: those facts belong to the repo, and the
skills read them from it.

The policy lives wherever the repo already keeps agent instructions — `CLAUDE.md`, `AGENTS.md`, or a
new `policy.md` when the repo has neither. [`init-agent-os`](/skills/init-agent-os) seeds it through
an interview, and `deliver-work` proposes additions to it over time as durable lessons appear.

## What it records

**Merge policy.** May agents merge, and under what conditions — green CI, an approving review, a
specific target branch? This is the one field with a hard default: if no merge policy is recorded, no
agent ever merges. Absence means forbidden, not undecided.

**Verify commands.** The exact commands that prove the project works: test, build, lint, run.
`verify-before-done` prefers these over any proxy it might invent, so a missing entry here degrades
every completion claim in the repo.

**Design system.** Where tokens and components live. The mockup step in `shape-work` is only allowed
to use what actually exists in the repo, and this pointer is where it starts looking.

**Planning surface.** The tracker or local folders that hold work, how maps and decision tickets are
represented, the type labels, and the conventions for blocking, claiming, spawned-issue links and
branch graduation. `chart-work` and `dispatch-next` are both unusable without this section.

**Branch and PR flow.** Target branch, PR conventions, who reviews.

**Conventions, gotchas and durable lessons.** Everything a new contributor — human or agent — would
otherwise learn by breaking something.

## How the interview works

`init-agent-os` reads the repository before it asks anything: existing instruction files, the README,
package and build files, CI configuration. A question the repo already answers does not get asked.

What remains is presented one decision at a time, each with a recommendation, and the result is drafted
as a policy section shown to you as a diff. Nothing is written until you approve that diff. The skill
handles one repository per run, and global mode touches no repository files, because mixing targets
would make the shown diff unreviewable — and the diff is the entire point.

## Keeping it alive

The seed is not the finished document. After a delivery, `deliver-work` proposes — but does not write
— any durable lesson worth recording. Accepting those proposals over a few months is what turns the
policy from a checklist into the thing that actually makes agent sessions in that repo predictable.

Two rules keep it honest. Record the merge policy explicitly even when the answer is "never", so the
absence is a decision rather than an omission. And keep verify commands current: a policy that names
a test command which no longer exists is worse than one that names none, because the agent will trust
it.
