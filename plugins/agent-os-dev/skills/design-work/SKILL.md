---
name: design-work
description: Sketches the user-facing interface of planned work in the medium the project has chosen, such as standalone HTML, a component workshop, or images, inside the real layout with the project's own look, and records the decisions in the spec's Interface section. User-invoked at any point, or continued into from plan-work when the developer chooses to sketch; no workflow requires it. Not for production UI implementation, polish of shipped screens, or work with no user-facing change.
disable-model-invocation: true
---

# Design work

Sketch what people will see and do, so the person can decide it by looking. When is their choice:
before a spec exists, to find out what they are trying to solve; before delivery, to settle a
screen; after delivery, to reconsider a screen that was left to it; or not at all. No workflow
requires this skill. The result is a set of sketches in the medium the project chose and, when a
spec exists, an `## Interface` section that says for each sketched screen and state what was decided
and why. A product owner or account manager should be able to
judge the sketches without a design tool or a checkout; when the person deciding has no checkout,
give them images.

## Inputs

Read the project policy, the intent and spec when they exist, and the request. The policy's
`## Design` section names how sketches are made (`Sketch with`), where they live (`Sketches live`),
the widths that matter, and optionally when the project sketches (`When`: `before delivery`,
`after delivery`, `ask`, or `never`). Then inspect the tokens, the shared components, and the nearest existing
views. Resolve these facts yourself; ask the person only about what the product should be.

## Medium

`Sketch with` is the project's choice, and this skill is not tied to any tool:

- `html`: standalone files that need no install and no project dependency, styled from the project's
  real tokens and layout.
- A component workshop such as Storybook, named with the command that starts it: stories built from
  the project's own components.
- `image`: pictures only, for a project with nothing to sketch in.
- Anything else the policy describes, followed as described.

When the policy sets no medium, ask once: recommend the workshop when the repository has one, and
`html` otherwise. Ask where sketches live in the same question, recommending
`intents/<id>/sketches/`. Offer to save the answer as a `## Design` section in the file that holds
the project policy, and write it only on a yes; with no such file, `init-agent-os` records it. Do not add Storybook or another dependency on your own. When the named tool is unavailable, or a
workshop's configuration does not pick up the sketch location, tell the person what is missing and
offer `html` for this run instead of changing the configuration.

`Sketches live` is a path in the repository, or `not in the repository`. Images are always available
as the way a sketch reaches people when its files cannot be committed: keep the working files
outside the checkout, render the sketch to PNG, and put the images on the pull request or at the
place the policy or the person names. With neither, ask where they should go.

Render with `scripts/render-sketch.mjs`, resolved relative to this `SKILL.md`:
`node <script> <file or local URL> --out <folder> --widths 390,1280`. It uses a Chrome or Edge already
on the machine, writes one PNG per width, and lists page errors and overflow. Exit 0 is clean, 1 means
it rendered with page errors, and 2 means it could not render. Never install a browser for it. When
you cannot render an image, say so and ask where the files should go.

## Working surface

The invocation authorizes sketch files, the made-up data they need, the spec's `## Interface`
section, plus its `rev` and `## Decision log` when the spec is already accepted, and a policy
`## Design` section the person agreed to save. It does not
authorize production components, routes, state, API, or dependency changes. When a sketch needs
something the design system lacks, build it inside the sketch area and label it as a new proposal;
never change a shared component to make a sketch work.

A spec is open for edits until its review merges. After that, every edit to `## Interface` is a
reconsideration, including settling an open or deferred decision or adding a missing section: raise
`rev` and add a `## Decision log` line, as `plan-work` describes. A plan built on the earlier spec
revision is then stale and is reshaped by `shape-work`.

## Sketch

Start from the spec's `## Interface` section: the surfaces it lists per role and the decisions it
marks open. A surface that is already decided is sketched only when the decision is about to
change. When the section says `None`, report that there is nothing to sketch and write no files.
When the section is missing or empty, derive the surfaces from the spec's behavior examples and
confirm the list with the person before sketching. With no spec yet, sketch from the request and
write no spec: report what the sketches settled, so `capture-intent` or `plan-work` can start from
them. A surface marked `Left to delivery:` is sketched only when the person asks, and its decision
then replaces that entry.

- **Real context.** Render each screen inside the layout the person will actually see, such as the
  application shell, navigation, and page frame, not as a lone component on a blank canvas.
- **The project's own look.** In a workshop, use the project's components and tokens. In any other
  medium, reproduce the look from the real tokens and layout, and state on the sketch that it is an
  approximation. Reuse established patterns, and mark anything new as new so nobody mistakes it for
  existing behavior.
- **Every state that matters.** Show the states the behavior examples imply, such as empty,
  loading, error, success, no permission, and long content, for each role that sees the screen.
  When layout depends on width, show the widths the policy names, or else common mobile, tablet,
  and desktop widths together with the breakpoints the application itself defines. Show keyboard or
  focus behavior when it is in scope.
- **Realistic made-up data.** Use plausible data in the product's own language. Never use real
  personal or customer data.
- **Invented wording.** Text the spec does not give, such as an error message, is a proposal. Mark
  it so in the sketch, list it in `## Interface`, and have the person confirm it with the decision
  it belongs to.
- **Alternatives for real choices.** When a design question has materially different answers, build
  two or three comparable alternatives with the same data side by side, recommend one, and let the
  person decide. Do not decide a product preference for them.

Keep fidelity at what the open decision needs. A structure question needs a rough layout; a
question about hierarchy or interaction needs the real components and states.

## Show it

Make each sketch openable for the person: start the workshop or check that it is running, give the
path of each HTML file, or show the images. Give the direct address of each sketch. Present each
open decision in plain language: what the person is looking at, the options, your recommendation,
and what changes if they choose otherwise. Ask one question at a time.

Iterate in the sketches until every listed decision is made or the person explicitly defers it.
When the person cannot answer now, commit the spec on a branch, with the sketches when they can be
committed, open a draft pull request that lists each open decision with the address or image of its
sketch, and wait. Never record your own recommendation as their decision.

The one exception is a person who explicitly hands the open decisions to you for this run, for
example so that work can continue while they are away. Then still build each sketch, choose your
recommendation, and record it as `Decided: (delegated)` with the reason and the rejected
alternatives. List every delegated decision in the pull request so the person can overturn it
there; merging the review is still their acceptance. A person who is only unavailable has delegated
nothing.

## Record

Write the outcome into the spec's `## Interface` section, one bullet per surface: the role and the
screen or state, then `Decided:` with the decision, its reason, the alternatives rejected, and the
sketch's location; `Deferred to <who> by <when>:` with what is undecided; or `Open:` with the question
while it waits on the person. Leave a `Left to delivery:` entry the person did not ask to sketch
as it is. The text must stand on its own: a reader who can no longer open the
sketch still knows what was decided.

A sketch's location must be reachable by everyone who reads the spec: a repository path, a pull
request image, or a URL, never a path that exists only on this machine. Until one exists, write that
the sketch is not yet published, and add the location when it is.

The sketches belong with the spec when they can be committed: commit them in the same change as the
spec when the request or the project's delivery defaults include committing, or when waiting on the
person as above. `deliver-work` reads the Interface section and its sketches;
a sketch is never promoted to production code.

## Ground truth

The work is done when:

- every sketch opens and renders without errors in its medium, with no render or console errors
  where those exist, and every image is legible;
- every behavior example with a visible result on a sketched surface appears in at least one
  sketch, or the Interface section says why it is not visual;
- the sketches were inspected visually at the widths and states that matter, by you and by the
  person; and
- every surface in `## Interface` has a decision or an explicit deferral with an owner.

Check these with the tools available, such as `scripts/render-sketch.mjs`, a browser on the sketch
or the workshop, the workshop's static build, or its test runner. Report a check you could not run instead of claiming it.

## Exit

Report which surfaces are settled, which are deferred, and where the sketches are. When this run
continued from `plan-work`, return to it so the plan can be marked ready. When it started from a
`shape-work` hand-back, shaping continues from the current spec revision. Planning or sketching
never starts product implementation.
