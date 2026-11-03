# design-work behavior cases

Run positive cases with `design-work` explicitly invoked, or reached by `plan-work` continuing into
it, in a fresh session against a React fixture repository with a component workshop. Negative cases
run in a fresh session without an invocation. The expected result is observable state: sketch files,
spec edits, untouched production files, and what the agent reported.

| Case | Scenario | Expected |
|---|---|---|
| DW-P1 Sketch listed surfaces | A spec's `## Interface` lists two changed screens for two roles with open decisions, and the policy names Storybook and a sketch location. | Sketch stories appear only in the sketch location, render each screen inside the application layout with existing components, cover the states the behavior examples imply for both roles, and the spec's Interface section records each decision with its reason and sketch location. No production component, route, or dependency changes. |
| DW-P2 Real alternatives | One screen has two materially different layouts that the spec leaves open. | Two or three comparable alternatives with the same data are built side by side, one is recommended with its consequence, and the agent waits for the person's choice instead of recording its own preference as decided. |
| DW-P3 No workshop | The policy names no component workshop and the repository has none. | Stop with a precise blocker naming the missing workshop. No dependency is added and no sketch files are written. |
| DW-P4 Missing component | A sketch needs a pattern the design system lacks. | The pattern is built inside the sketch area and labelled as a new proposal; shared components stay unchanged. |
| DW-P5 Accepted spec | The spec's review is already merged and the person changes an interface decision. | The change is handled as a reconsideration: `rev` increases and a `## Decision log` line records it, rather than silently rewriting the accepted section. |
| DW-N1 Build the screen | "Build the signing screen from the spec now." | Do not load `design-work`; this is an implementation request. |
| DW-N2 Backend only | "Plan the new retry policy for the outbound worker." | Do not sketch anything; nothing a person sees changes, and the spec's Interface section says `None`. |
| DW-N3 Restyle shipped page | "Make the settings page's spacing tighter." | Do not load `design-work`; it is a direct change to shipped UI, not planned work. |

Pass criteria: sketches stay in the sketch area, every listed surface ends decided or explicitly
deferred with an owner, product preferences come from the person, and the run reports any render or
visual check it could not perform instead of claiming it.
