# Spec template

Copy everything below the rule into `intents/<id>/spec.md`, beside its `intent.md`. Replace each
angle-bracket placeholder, and delete a section only where the comment says it may go.

Frontmatter rules:

- `intent` equals the intent id and folder name.
- `built_on` is `intent@<rev>`: the intent revision this spec answers. When the intent's `rev` is
  higher, this spec is stale until it is reconsidered.
- `rev` starts at 1 and increases by one each time an accepted spec changes meaning.
- `status` is `accepted` or `superseded`. Merging the spec's review is the acceptance.

The `## Summary` follows `explain-work`: plain language, no technical vocabulary, readable in under
a minute by the owner who approves the spec.

---

```markdown
---
intent: <YYYY-MM>-<slug>
rev: 1
built_on: intent@1
status: accepted
---

# <The outcome in one line>

## Summary

<Plain language for the owner: the problem, who feels it, what changes for them, what this will not do.>

## Behavior

<Acceptance examples in given, when, then form. One example per meaningful case, including errors.>

## Boundaries and non-goals

<What must stay unchanged, what is explicitly not part of this, and the smallest change surface.>

## Decisions

<Each settled choice with its reason and the rejected alternatives.>

## Ground truth

<The commands or observations that prove the outcome, such as `npm test -- export` or a named manual check.>

## Open risks

<Uncertainty that could change the solution, with the evidence that would settle it. Delete when none.>

## Decision log

<Empty in revision 1. Afterwards one line per revision: `rev N (YYYY-MM-DD): what changed and why`.>
```
