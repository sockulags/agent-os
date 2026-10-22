---
title: capture-intent
description: Question out the need behind a stated wish and record it as a versioned intent file.
skill-description: Captures what is needed and why as a versioned intent file, questioning out the need behind a stated wish one load-bearing question at a time. User-invoked when a new need, feature request, or tracker item should become an intent, or as the questioning stage of plan-work. Not for requests whose goal is already articulated, small fixes, or facts the repository answers.
summary: Capture the need behind a wish as a versioned intent
---

# capture-intent

**Bucket:** workflow · **Invocation:** manual · `/capture-intent` (direct Claude), `/agent-os-core:capture-intent` (Claude plugin), or `$capture-intent` (Codex)

Finds the need behind a stated wish and records it where the next person and agent will find it.
The result is a settled intent: who needs what, why now, the desired outcome, what is out of scope,
and the questions that remain open. It is not a plan or a solution. capture-intent replaces the
former `understand-work` and keeps its questioning loop.

## Questioning

Everything the repository, project policy, existing intents, linked tracker items, and the
conversation already answer is resolved first. For each open point that changes the goal, the
skill presents the tension, recommends one answer with its consequence, and asks one load-bearing
question at a time. Silence, momentum, or approval of a larger bundle never counts as an answer to
a specific question. No technical solution is proposed while the goal is still moving.

## The intent file

A file is written when the need outlives the session, needs an owner's agreement, or will be
planned and delivered in more than one step. A small fix needs no file.

- Location: `intents/<id>/intent.md`, or the intent location the project policy names, such as a
  separate product repository.
- Id: `<YYYY-MM>-<slug>`. Existing intents are searched first so the same need is not captured
  twice.
- Frontmatter: `id`, `status: accepted`, `rev: 1`, `supersedes`, plus any key the project policy
  asks for, such as a tracker key. Merging the review is the acceptance.

The invocation authorizes the file. Committing it and opening a pull request happens only when the
request or the project's delivery defaults include that, and the skill never merges the review.

An accepted intent changes only through a new review that raises `rev` and adds a line to its
`## Decision log`. Every spec and plan built on the earlier revision becomes stale. The full format
is in [Intent, spec, and plan files](/reference/intents).

## Exit

The report names the intent path and id, the choices with their reasons, ruled-out directions, and
open questions, and recommends one next action, usually [plan-work](/skills/plan-work).
