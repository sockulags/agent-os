---
name: design-work
description: Sketches the user-facing interface of planned work as stories in the project's component workshop, Storybook by default, built inside the real layout from the project's own components, and records the decisions in the spec's Interface section. User-invoked, or continued into from plan-work when a spec changes what a person sees or does. Not for production UI implementation, polish of shipped screens, or work with no user-facing change.
disable-model-invocation: true
---

# Design work

Settle what people will see and do before delivery starts. The result is a set of sketches that run in
the project's own component workshop, and a spec whose `## Interface` section says, for every new or
changed screen and state, what was decided and why. Anyone who has checked out the repository and
can build its frontend can open the sketches, so a product owner or account manager can judge them
without a design tool.

## Inputs

Read the project policy, the intent and spec when they exist, and the request. The policy names the
design system's location, the component workshop and the command that starts it, and where sketches
live and how they are named. Then inspect the tokens, the shared components, and the nearest
existing views and their stories. Resolve these facts yourself; ask the person only about what the
product should be.

When the policy names no workshop and the repository has none, stop and report that precisely. Do
not add Storybook or another dependency on your own; that is a repository change for the person or
`init-agent-os` to decide. When the workshop exists but its configuration does not pick up the
sketch location, pause and tell the person what is missing instead of changing the configuration.

## Working surface

The invocation authorizes sketch stories, the made-up data they need, and the spec's `## Interface`
section, plus its `rev` and `## Decision log` when the spec is already accepted. It does not
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
confirm the list with the person before sketching.

- **Real context.** Render each screen inside the layout the person will actually see, such as the
  application shell, navigation, and page frame, not as a lone component on a blank canvas.
- **Own building blocks.** Use the project's components and tokens. Reuse established patterns, and
  mark anything new as new so nobody mistakes it for existing behavior.
- **Every state that matters.** Show the states the behavior examples imply, such as empty,
  loading, error, success, no permission, and long content, for each role that sees the screen.
  When layout depends on width, show the widths the policy names, or else common mobile, tablet,
  and desktop widths together with the breakpoints the application itself defines. Show keyboard or
  focus behavior when it is in scope.
- **Realistic made-up data.** Use plausible data in the product's own language. Never use real
  personal or customer data.
- **Alternatives for real choices.** When a design question has materially different answers, build
  two or three comparable alternatives with the same data side by side, recommend one, and let the
  person decide. Do not decide a product preference for them.

Keep fidelity at what the open decision needs. A structure question needs a rough layout; a
question about hierarchy or interaction needs the real components and states.

## Show it

Start the workshop for the person, or check that it is running, and give the direct address of each
sketch. Present each open decision in plain language: what the person is looking at, the options,
your recommendation, and what changes if they choose otherwise. Ask one question at a time.

Iterate in the sketches until every listed decision is made or the person explicitly defers it.
When the person cannot answer now, commit the sketches with the spec on a branch, open a draft pull
request that lists each open decision with the address of its sketch, and wait. Never record your
own recommendation as their decision.

## Record

Write the outcome into the spec's `## Interface` section. For each surface: the role, the screen or
state, the sketch's location in the workshop, the decision and its reason, and the alternatives
rejected. A deferred decision stays visible with who decides it and when it must be settled.

The sketches belong with the spec: commit them in the same change as the spec when the request or
the project's delivery defaults include committing, or when waiting on the person as above.
`deliver-work` reads the Interface section and its sketches; a sketch is never promoted to
production code.

## Ground truth

The work is done when:

- every sketch story renders in the workshop without render errors or console errors;
- every behavior example with a visible result on a sketched surface appears in at least one
  sketch, or the Interface section says why it is not visual;
- the sketches were inspected visually at the widths and states that matter, by you and by the
  person; and
- every surface in `## Interface` has a decision or an explicit deferral with an owner.

Check these with the tools available, such as a browser on the running workshop, the workshop's
static build, or its test runner. Report a check you could not run instead of claiming it.

## Exit

Report which surfaces are settled, which are deferred, and where the sketches are. When this run
continued from `plan-work`, return to it so the plan can be marked ready. When it started from a
`shape-work` hand-back, shaping continues from the current spec revision. Planning or sketching
never starts product implementation.
