---
title: Workflow file
description: The per-project file that sets the route for each kind of work, the tracker, where information goes, and the tasks that finish a delivery.
---

# Workflow file

`.agent-os/workflow.md` says how work moves through one repository: which steps each kind of work
takes, which tracker holds the issues, where records go, and which tasks finish a delivery.
[`init-agent-os`](/skills/init-agent-os) writes it and adds one line to the project policy that
points to it. The rules live in their own file so the project policy stays short, and so a team
that uses another tracker or documents its work somewhere else can say so in one place.

> The canonical template agents load is
> [`workflow-template.md`](https://github.com/sockulags/agent-os/blob/main/plugins/agent-os-dev/skills/init-agent-os/references/workflow-template.md).

The file is project policy. A route, a tracker rule, or a finishing task written here counts as the
project policy including it. Change it through a pull request, or run `init-agent-os` again and
choose "routes and finishing tasks".

## Routes

A route is the list of steps for one kind of work. These are the defaults; the file can change any
row or add rows for kinds of work the team knows:

| Work | Route |
|---|---|
| Bug with a known fix | shape-work (one issue), deliver-work |
| Small change, or a bug whose fix holds a choice | plan-work, shape-work, deliver-work |
| Feature | plan-work when anything is unclear, shape-work, deliver-work |
| Initiative | capture-intent, plan-work, shape-work, deliver-work, finishing tasks |

Every default route gives the work an issue before delivery, so each change can be traced from the
tracker to its pull request. `deliver-work` follows the route: when the route puts `shape-work`
first and the work has no issue, it recommends `shape-work`, and when this file exists and the
tracker can be written, it also stops before changing code unless you say to skip the issue. When `plan-work` finishes and the next step is `shape-work`, it asks once
whether to create the issues now, unless your `Next step:` preference says otherwise.

## Route line

Every Agent OS workflow ends with a route line: the kind of work, the steps done and the steps
left, and the exact command that resumes the work. For example:

> Small change. plan-work and shape-work are done, and issue #42 is ready. deliver-work is left. To
> continue, run `/deliver-work #42`.

The line makes it easy to pick the work up the next day, or for a colleague to take it over.

What happens after the line is a personal preference, set by `init-agent-os global` as a
`Next step:` line in your `## My working preferences`. With `ask`, the default, the agent asks once
whether to start the next step. With `continue`, it starts the next planning step on its own and
asks once before delivery. With `recommend`, it only names the next step. None of them skips a step,
decides an open product question, merges, or deploys.

## Tracker

The tracker section names the tracker, anything new issues need such as labels or a project board,
and whether an initiative's units live in `plan.md` or the tracker. Without it, `shape-work` uses
the repository host's issue tracker when the session can write to it.

`shape-work` may create the new issues it shapes without further permission. A `## Tracker mandate`
section, here or in the project policy, names anything more the agent may do in the tracker, such
as updating or commenting on issues in the authorized set. It never changes priority, assignee, or
acceptance, and never closes items.

## Where information goes

A short list of where records live: intents and specs for initiatives, the decisions of smaller
work in their issues and pull requests, and any other place the team keeps records.

## Finishing tasks

Finishing tasks run when a piece of work is complete. The usual use is an initiative: after its
last unit, before the pull request is marked ready, `deliver-work` runs the tasks under
`### Initiative`, for example:

```markdown
## Finishing tasks

### Initiative

- Add the change to `CHANGELOG.md` under the next release.
- Write a summary of what changed and why on the wiki page "Product changes".
```

A task inside the repository becomes part of the final pull request and is reviewed with it. A
task in an external system runs when the session has a tool that can write there; otherwise the
agent writes the finished text and hands it over with its destination. The delivery report lists
every task as done or handed off. A finishing task never merges, deploys, or closes anything unless
it says so.
