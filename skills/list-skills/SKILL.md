---
name: list-skills
description: Lists the installed agent-os skills with their invocation syntax and purpose so the developer can see what is available and pick the right one. Use manually when the developer asks what agent-os can do, which skill fits, or for a skill list, overview, or reference card. Not for running any listed skill, choosing or dispatching the next action in planned work, or explaining work already underway.
disable-model-invocation: true
---

# List skills

Answer what this installation offers and how to reach it. The skill returns one reference card and
changes nothing.

## Read the installation, never a remembered list

Take every skill from the sibling directories beside this one, using each `SKILL.md` frontmatter for
its name and description. A reference card recited from memory goes stale the moment a skill is
added, removed, or partially installed, and it hides exactly the drift a developer opens the card to
find. Report a directory whose frontmatter is missing or unreadable as unavailable rather than
omitting it.

Each skill's own frontmatter also carries its invocation: `disable-model-invocation: true` plus
`agents/openai.yaml` means the developer invokes it explicitly; neither switch means it is automatic
and needs no invocation.

## Report

Group by invocation, explicit skills first, and give each one line: how to invoke it and what it
does, condensed from its description rather than copied whole. Show the invocation form matching how
this skill was itself reached — `/agent-os:<name>` through the Claude plugin, `/<name>` for a direct
Claude install, `$<name>` on Codex — and name which form is shown, since the same skill set is typed
differently per host.

Close with the entry points for a developer who has not named a skill: an unclear desire starts at
`guide-me`, bounded choices at `shape-work`, broad or coupled work at `chart-work`, and a
decision-complete unit at `deliver-work`. Say plainly that automatic skills need no entry point
instead of listing them as choices.

## Boundaries

One card, then stop. Do not invoke, stage, or offer to run a listed skill, and write no file, state,
or default. Listing what exists is not choosing what to do next: a developer who wants the next
action picked or dispatched wants `dispatch-next`, and one who wants the current task described
wants `explain-work`.
