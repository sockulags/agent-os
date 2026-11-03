---
title: design-work
description: Sketch new and changed screens in the project's component workshop and record the decisions in the spec.
skill-description: Sketches the user-facing interface of planned work as stories in the project's component workshop, Storybook by default, built inside the real layout from the project's own components, and records the decisions in the spec's Interface section. User-invoked, or continued into from plan-work when a spec changes what a person sees or does. Not for production UI implementation, polish of shipped screens, or work with no user-facing change.
summary: Sketch new and changed screens in the component workshop before delivery
---

# design-work

**Bucket:** workflow · **Invocation:** manual · `/design-work` (direct Claude), `/agent-os-dev:design-work` (Claude plugin), or `$design-work` (Codex)

Settles what people will see and do before delivery starts. The sketches run in the project's own
component workshop, Storybook by default, so anyone who has checked out the repository and built
its frontend can open and judge them. No separate design tool is needed.

```mermaid
flowchart TD
    A[Spec with an Interface section, or plan-work continuing] --> B[Read policy, design system,<br>nearby views and stories]
    B --> C[Sketch each surface per role<br>inside the real layout]
    C --> D{Real design choice?}
    D -->|yes| E[Two or three alternatives,<br>one recommendation]
    E --> F[Person decides]
    D -->|no| G[Show the sketch]
    F --> G
    G --> H[Decisions written to the spec's Interface section]
    H -.-> I([Back to plan-work or shape-work])
```

The project policy names the design system, the workshop and the command that starts it, and where
sketches live. When a project has no workshop, the skill stops and says so instead of adding one.

Each sketch renders the screen inside the layout the person will actually see, uses the project's
own components and tokens, and marks anything new as new. It shows the states the behavior examples
imply, such as empty, loading, error, success, no permission, and long content, for each role, at
the widths that matter. Data is realistic but made up. When a design question has materially
different answers, the skill builds two or three alternatives side by side, recommends one, and the
person decides.

The skill starts the workshop for the person and gives the direct address of each sketch, then asks
one plain-language question at a time. The outcome goes into the spec's `## Interface` section: per
surface, the role, the sketch's location, the decision and its reason, and the rejected
alternatives. A deferred decision names who settles it.

The sketches are committed with the spec. Delivery builds the real view from the spec and uses the
sketch as its visual reference; a sketch never becomes production code. The invocation authorizes
sketch stories and the spec's Interface section, not production components, routes, or
dependencies.

## Done when

- every sketch story renders without render or console errors;
- every behavior example with a visible result appears in a sketch, or the spec says why not;
- the sketches were inspected at the widths and states that matter; and
- every surface in `## Interface` has a decision or an explicit deferral with an owner.

## How it fits

[`plan-work`](/skills/plan-work) lists the new and changed screens in the spec and continues into
design-work when they need sketches. [`shape-work`](/skills/shape-work) does not sketch: it links
the settled Interface section and returns an open interface question here, keeping the affected
units blocked until it is settled.
