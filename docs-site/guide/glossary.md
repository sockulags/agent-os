---
title: Glossary
description: The words Agent OS uses, each explained in a sentence or two.
---

# Glossary

Agent OS uses a small set of words with a fixed meaning. Each entry says what the word means and
where you meet it. Entries are in alphabetical order.

**Adjacent, required, unrelated.** How [`scope-guard`](/skills/scope-guard) sorts something found
during a task. Required work is needed for the task to work and stays in. Adjacent work is useful
but not needed now and becomes a follow-up. Unrelated work is left out without a proposal.

**Automatic skill.** A skill that starts by itself when the situation matches, such as
`verify-before-done` or `check-work`. You never need to call it. See also *manual skill*.

**Baseline.** The snapshot of the working tree that [`quality-ratchet`](/skills/quality-ratchet)
takes before the first change. The finished change is compared with it, so the agent can show what
it made larger, smaller, or more complex.

**`built_on`.** A line at the top of a spec or plan that names the revision of the file it was
written from, for example `built_on: intent@2`. When the source file gets a higher revision, the
spec or plan is *stale*.

**Claim.** A sign that someone is working on a unit: a draft pull request whose body carries the
unit's `Intent-Unit` line. A claimed unit is skipped by everyone else.

**Decision map.** The deepest planning level of [`plan-work`](/skills/plan-work), used for a large
initiative: a list of decision tickets with owners and dependencies, so several people can settle
questions in parallel. Most work never needs one. See [Maps and decision tickets](/reference/maps-and-tickets).

**Discipline.** An automatic skill that shapes how the agent works in every session, such as
keeping to scope or showing evidence before saying something is done.

**Epic.** A unit with several child units that together deliver one shared result. It has its own
acceptance and an owner for checking the whole result.

**Frontier.** The units, or decision tickets, that can be started now because everything they depend
on is done.

**Ground truth.** The test, command, or observation that can decide whether the work is done. "The
build passes" is ground truth only when the build is what the work changes.

**Guard hooks.** Small programs that the host runs at session start and before each edit. They
block edits to protected files, to accepted intents and specs during delivery, and to a locked
test. See [Guard hooks](/reference/guards).

**Handoff.** The summary `plan-work` passes to `shape-work` when one part of a large plan is ready
to be split into units.

**Intent.** A short file, `intents/<id>/intent.md`, that says who needs what and why. Written by
[`capture-intent`](/skills/capture-intent). See [Intent, spec, and plan files](/reference/intents).

**`Intent-Unit`.** The line `Intent-Unit: <intent-id>/<unit-key>` in a pull request body. It ties
the pull request to a unit, and it is how Agent OS knows which units are claimed or delivered.

**Manual skill.** A skill that runs only when you call it by name, such as `plan-work` or
`deliver-work`. The agent may suggest one, but never starts it by itself.

**Mandate.** What the current request and the project policy allow the agent to do. A request to
plan allows planning files; a request to build allows code changes; merging, deploying, and writing
to a tracker need to be named.

**Plan.** The file `intents/<id>/plan.md`, written by [`shape-work`](/skills/shape-work). It lists the
delivery units and their dependencies, never their status.

**Project policy.** The repository's own rules for the agent, in `CLAUDE.md` or `AGENTS.md`. It is
written by [`init-agent-os`](/skills/init-agent-os) and grows with `record-lesson`. See
[Project policy](/guide/project-policy).

**Quality ratchet.** The check that compares the finished change with the *baseline*. Its numbers
are evidence for the review, not a score that passes or fails. A hook stops the turn when the check
is missing or out of date. See [`quality-ratchet`](/skills/quality-ratchet).

**Revision (`rev`).** The version number of an intent, spec, or plan. An accepted file changes only
through a new review that raises `rev` by one and adds a line to its decision log.

**Spec.** The file `intents/<id>/spec.md`, written by [`plan-work`](/skills/plan-work). It holds the
behavior, the screens, the boundaries, the decisions, and the ground truth. When a unit and the spec
disagree, the spec wins.

**Stale.** A spec or plan whose `built_on` revision is older than its source. Nothing is shaped or
delivered from it until someone checks it again.

**Tracker mandate.** A section in the project policy that allows the agent to write to an issue
tracker such as GitHub Issues or Jira. Without it, the agent reports tracker changes instead of making
them.

**Unit.** One piece of delivery: the smallest result that is useful or can be checked on its own,
usually one pull request. A unit names its outcome, boundaries, the code to change, acceptance, and
ground truth.
