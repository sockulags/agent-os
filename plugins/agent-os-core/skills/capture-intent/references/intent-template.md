# Intent template

Copy everything below the rule into `intents/<id>/intent.md`. Replace each angle-bracket
placeholder, and delete a section only where the comment says it may go.

Frontmatter rules:

- `id` equals the folder name, `<YYYY-MM>-<slug>`.
- `status` is `accepted`, `done`, or `superseded`. A new intent is written as `accepted`: merging
  its review is the acceptance. `deliver-work` sets `done` in the pull request that delivers the
  last unit. Delivery progress is never written here.
- `rev` starts at 1 and increases by one each time an accepted intent changes meaning.
- `supersedes` is the id of the intent this one replaces, or `null`.
- Extra keys, such as a tracker key, are allowed when the project policy asks for them.

---

```markdown
---
id: <YYYY-MM>-<slug>
status: accepted
rev: 1
supersedes: null
---

# <The outcome in one line>

## Who and why

<Who has the need, what they cannot do today, and why it matters now.>

## Desired outcome

<What is true when this is done, observable by the people who asked for it.>

## Out of scope

<What this deliberately does not do, with the reason when it is not obvious.>

## Open questions

<Questions only the owner can answer. Delete this section when none remain.>

## Decision log

<Empty in revision 1. Afterwards one line per revision: `rev N (YYYY-MM-DD): what changed and why`.>
```
