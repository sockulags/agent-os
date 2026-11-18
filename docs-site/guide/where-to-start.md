---
title: Where to start
description: Pick the skill from the situation you are in, not from the skill names.
---

# Where to start

Find the sentence below that sounds most like your situation and use the skill it names. You do not
need to know the rest of the system first. The examples use a direct Claude install, `/<skill>`. In
the Claude plugin the same skill is `/agent-os-core:<skill>` or `/agent-os-dev:<skill>`, and in Codex
it is `$<skill>`.

```mermaid
flowchart TD
    A{"What do you have?"} -->|"a vague idea, a problem,<br>or someone else's wish"| B["capture-intent"]
    A -->|"a clear need, but behavior<br>or decisions are not settled"| C["plan-work"]
    A -->|"a settled spec that several<br>pull requests will deliver"| D["shape-work"]
    A -->|"a clear task or a ready unit"| E["deliver-work"]
    A -->|"a bug"| F["Describe the bug,<br>no skill needed"]
    A -->|"a diff or a pull request"| G["Ask for a review,<br>check-work starts by itself"]
```

If you start one step too early, the skill notices that the earlier question is already settled and
moves on. If you start one step too late, it stops and names the step you skipped. Either way you
lose little, so pick the nearest match and go.

## Figure out what to build

**"I have an idea, a complaint from a customer, or a wish, and I am not sure what is really
needed."** Use [`capture-intent`](/skills/capture-intent). It asks one question at a time until the
need is clear and writes it down as an intent, a short file that says who needs what and why.

**"I know what we need, but not exactly how it should behave, or there are choices nobody has made
yet."** Use [`plan-work`](/skills/plan-work). It reads the code, asks only the questions the code
cannot answer, and writes a spec: the behavior, the boundaries, the decisions, and how to prove the
result works. It picks its own depth, so a small change gets a short spec.

**"I want to see the screens before anyone builds them."** Use [`design-work`](/skills/design-work).
`plan-work` also offers it when a screen is still undecided.

**"The spec is settled and the work is too big for one pull request."** Use
[`shape-work`](/skills/shape-work). It splits the spec into delivery units, each one a work order
that a person or an agent can start from alone. It does not settle product questions; it sends
those back to `plan-work`.

## Build it

**"The task is clear. Build it."** Use [`deliver-work`](/skills/deliver-work). It builds the change,
tests it, has it reviewed by a separate agent, and stops at the boundary you asked for, such as a
local change or a pull request. Give it a unit from a plan, a tracker issue, or the task in your own
words.

**"Finish this whole intent."** Also `deliver-work`, with the intent's id, for example
`/deliver-work finish intent 2026-11-csv-export`. It shapes the plan if there is none and delivers
the units one after another.

**"There is a bug."** Describe it. No skill is needed: with agent-os-dev installed, the disciplines
that always run make the agent reproduce the bug and find its cause before it changes code, and add a test that fails
without the fix. Use `deliver-work` when you also want its pull request and review steps.

**"Run several ready units at the same time."** Use [`batch-work`](/skills/batch-work). It runs only
when you ask for it by name, because running in parallel is your decision, not the agent's.

## Check and tidy

**"Look at this diff, branch, or pull request."** Ask for a review in your own words.
[`check-work`](/skills/check-work) starts by itself, reports what it finds, and changes nothing.
Say "review and fix" when you want it to fix what it finds.

**"This code feels overbuilt."** Use [`simplify`](/skills/simplify). It can review a diff, look over
a whole repository, or remove code you no longer need.

**"Explain this plan, or make this text shorter."** Use [`explain-work`](/skills/explain-work).

## Set up and find your way

**"This repository has not been set up for Agent OS yet," or "I want to change how we work here."**
Use [`init-agent-os`](/skills/init-agent-os). It asks a few questions about how the team works and
writes the project policy.

**"What do we have planned, and what should I take next?"** Use
[`dispatch-next`](/skills/dispatch-next). It reads the plans and open pull requests and names one
next action with the reason.

**"What can Agent OS do here?"** Use [`list-skills`](/skills/list-skills). It lists what is
installed and how to call it.

## When you do not name a skill

You can always just describe the work. The disciplines run anyway: the agent keeps to the task,
shows evidence before it says something is done, and finds the cause before it fixes a bug. When
your request clearly matches a skill you did not name, the agent says so in one sentence and then
does what you asked. It never starts a manual skill on its own.

Words that are new to you are explained in the [glossary](/guide/glossary).
