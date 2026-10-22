---
name: capture-intent
description: Captures what is needed and why as a versioned intent file, questioning out the need behind a stated wish one load-bearing question at a time. User-invoked when a new need, feature request, or tracker item should become an intent, or as the questioning stage of plan-work. Not for requests whose goal is already articulated, small fixes, or facts the repository answers.
disable-model-invocation: true
---

# Capture intent

Find the need behind the stated wish and record it where the next person and agent will find it.
The deliverable is a settled intent: who needs what, why now, the desired outcome, what is out of
scope, and the questions that remain open. It is not a plan or a solution.

## Questioning loop

Resolve everything the repository, project policy, existing intents, linked tracker items, and the
conversation already answer before asking anything. Then, for each open point that materially
changes the goal:

- Present the concrete tension with materially different alternatives.
- Recommend one and name its consequence.
- Ask one load-bearing question at a time and wait for the answer.
- Record the choice, the reason, and every ruled-out direction with its reason.

Dig beneath the stated wish: what becomes possible when this exists, who feels the difference, and
why it matters now. Do not treat silence, momentum, or approval of a larger bundle as an answer to
a specific question. Do not propose a technical solution while the goal is still moving.

Questioning ends when the person says it is done or when further answers stop changing the goal.

## Write the intent

Write a file when the need outlives this session, needs an owner's agreement, or will be planned
and delivered in more than one step. A small fix or a question settled in the conversation needs no
file: report the settled understanding directly.

1. Choose the location. Use `intents/` at the repository root unless the project policy names
   another intent location, such as a separate product repository.
2. Choose the id `<YYYY-MM>-<slug>` from the current month and a short kebab-case name. Search the
   existing intent folders first: reuse an intent that already covers this need instead of creating
   a second one.
3. Write `intents/<id>/intent.md` from [references/intent-template.md](references/intent-template.md).
   A new intent has `rev: 1` and `status: accepted`, because merging its review is what accepts it.
   Keep any extra frontmatter keys the project policy asks for, such as a tracker key.
4. Write in the language the project uses for product text. Keep it short enough to read in a few
   minutes; behavior details, decisions, and ground truth belong in the spec that `plan-work` writes.

The invocation authorizes writing the intent file. Commit it on a branch and open a pull request
for the owner's review only when the request or the project's delivery defaults include that;
otherwise leave the file for the person to commit. Never merge the review yourself.

## Changing an accepted intent

An accepted intent changes only through a new review. Increase `rev` by one, add a line to its
`## Decision log` with the date, what changed, and why, and keep the earlier wording addressable in
history rather than rewriting the reason away. Every spec or plan built on the earlier revision is
now stale; name them in the report so `plan-work` can reconsider them. Replace an intent with a new
one only when the need itself changed: give the new intent `supersedes: <old-id>` and set the old one
to `status: superseded` in the same review.

## Exit

Report the intent path and id, the choices made with their reasons, the ruled-out directions, and
the questions that remain open. Recommend one next action: usually `plan-work` when behavior,
decisions, or ground truth still need settling. Under plan-work, this stage informs the spec and
adds no separate approval gate.
