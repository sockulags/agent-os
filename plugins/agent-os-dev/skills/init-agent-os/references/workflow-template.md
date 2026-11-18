# Workflow file template

`init-agent-os` writes `.agent-os/workflow.md` from this template and adds one line to the project
policy that points to it, so every host finds it: `Work routes, tracker, and finishing tasks:
.agent-os/workflow.md.` The file holds how work moves through this repository, so the policy itself
stays short. It is project policy: a route, tracker rule, or finishing task written here counts as
the project policy including it.

Keep the headings. Fill each section from the developer's answers and repository evidence, and drop
an optional section that has nothing to say. Write it in the language the project uses for
documentation.

```markdown
# How we work

Agent OS reads this file to choose the next step for a piece of work, to know where issues and
records go, and to run the tasks that finish a delivery. The project policy points here. Change it
through a pull request like any other policy.

## Routes

| Work | Route |
|---|---|
| Bug with a known fix | shape-work (one issue), deliver-work |
| Small change, or a bug whose fix holds a choice | plan-work, shape-work, deliver-work |
| Feature | plan-work when anything is unclear, shape-work, deliver-work |
| Initiative | capture-intent, plan-work, shape-work, deliver-work, finishing tasks |

An initiative is work that several pull requests deliver and whose product decisions someone other
than the requester must agree to. Only initiatives get intent, spec, and plan files.

## Tracker

- Tracker: <GitHub Issues in this repository, or the tracker and project to use>
- New issues: <labels, issue type, or project board to set, or "nothing extra">
- An initiative's units live in: <plan.md | the tracker>

## Tracker mandate

<Optional. What the agent may do in the tracker beyond creating the issues shape-work shapes, such
as commenting on or updating issues in the authorized set. It never changes priority, assignee, or
acceptance, and never closes items.>

## Where information goes

- Intents and specs: <intents/ in this repository, or another repository>
- Decisions of smaller work: the tracker issues and their pull requests
- <Any other place the team keeps records, such as a decision log or a wiki space>

## Finishing tasks

### Initiative

<Tasks that run after the last unit of an initiative, before its pull request is marked ready.
One line each, saying what to write and where, for example:>

- Add the change to `CHANGELOG.md` under the next release.
- Write a summary of what changed and why on the wiki page <name or link>.

### <Another route, optional>

<Tasks for another kind of work, when the team wants them.>
```

## Rules for the routes

- Each route lists steps in order. A step marked "when anything is unclear" or similar runs only
  when that condition holds; every other step runs.
- A route that starts at `shape-work` means the work gets an issue before delivery, for
  traceability. `deliver-work` follows it unless the request says to skip the issue.
- The developer may change the rows, add rows for kinds of work the team knows, or remove a row. A
  kind of work with no row falls back to the default route in the global policy.

## Rules for finishing tasks

- A task inside the repository, such as a changelog entry, is part of the final pull request.
- A task in an external system, such as a wiki or a documentation site, runs when the session has a
  tool that can write there. Otherwise the agent writes the finished text and reports it as a
  handoff with its destination, and the delivery report lists it as not done.
- Finishing tasks never merge, deploy, or close anything unless the task says so explicitly.
