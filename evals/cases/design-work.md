# design-work behavior cases

Run positive cases with `design-work` explicitly invoked, or reached by `plan-work` continuing into
it, in a fresh session against a React fixture repository, with a component workshop unless the case
says otherwise. Negative cases
run in a fresh session without an invocation. The expected result is observable state: sketch files,
spec edits, untouched production files, and what the agent reported.

| Case | Scenario | Expected |
|---|---|---|
| DW-P1 Sketch listed surfaces | A spec's `## Interface` lists two changed screens for two roles with open decisions, and the policy names Storybook and a sketch location. | Sketch stories appear only in the sketch location, render each screen inside the application layout with existing components, cover the states the behavior examples imply for both roles, and the spec's Interface section records each decision with its reason and sketch location. No production component, route, or dependency changes. |
| DW-P2 Real alternatives | One screen has two materially different layouts that the spec leaves open. | Two or three comparable alternatives with the same data are built side by side, one is recommended with its consequence, and the agent waits for the person's choice instead of recording its own preference as decided. |
| DW-P3 No medium set | The policy sets no medium and the repository has no workshop, whether reached directly or through `plan-work`. | It asks once for the medium and location and recommends `html`. After the answer it writes standalone files that follow the project's tokens and layout and say they are an approximation. No dependency is added. |
| DW-P10 HTML from policy | The policy says `Sketch with: html` and names a sketch location. | No medium question is asked. Standalone HTML sketches appear only in that location and open without an install or a project dependency. |
| DW-P11 Not in the repository | The policy says `Sketches live: not in the repository`. | No sketch file is committed. Each sketch reaches the person as a PNG on the pull request or at a named place, and `## Interface` states each decision and its reason in text that stands without the image. |
| DW-P12 Named tool unavailable | The policy names Storybook, but it does not start or does not pick up the sketch location. | It reports what is missing and offers `html` for this run. It changes no workshop configuration or dependency. |
| DW-P13 Medium described by the project | The policy describes another way to sketch, such as a named design tool and how to reach it. | It follows the policy's description instead of falling back to a built-in medium. |
| DW-P4 Missing component | A sketch needs a pattern the design system lacks. | The pattern is built inside the sketch area and labelled as a new proposal; shared components stay unchanged. |
| DW-P5 Accepted spec | The spec's review is already merged and the person changes an interface decision. | The change is handled as a reconsideration: `rev` increases and a `## Decision log` line records it, rather than silently rewriting the accepted section. |
| DW-P6 Nothing to sketch | Invoke `design-work` on a spec whose `## Interface` section says `None`. | Report that there is nothing to sketch; no sketch files are written and the spec is unchanged. |
| DW-P7 Settle deferred in accepted spec | The spec's review is merged, one surface is deferred with an owner, and `plan.md` is built on that spec revision. The owner now decides it in the sketch. | The decision is recorded with a raised `rev` and a `## Decision log` line, and the report names `plan.md` as stale for `shape-work` to reshape. |
| DW-P8 Person unavailable | Sketches for two open decisions are ready, but the person says they cannot answer today. | The sketches and spec are committed on a branch and a draft pull request lists each open decision with its sketch address. The agent then waits; no recommendation is recorded as decided. |
| DW-P18 Person delegates | Sketches for two open decisions are ready and the person says to decide them without asking, because they will be away. | Each surface is recorded as `Decided: (delegated)` with its reason, rejected alternatives, and sketch location, and the pull request lists both delegated decisions for the person to overturn. Nothing is merged. |
| DW-P19 Before a spec | The person invokes `design-work` with only a rough request and no intent or spec, to find out what they want. | Sketches are built from the request with alternatives where the answer is open. No spec is written; the report says what the sketches settled for `capture-intent` or `plan-work`. |
| DW-P20 Left to delivery | A spec marks one surface `Left to delivery:` and another open; the person asks to sketch only the open one. | Only the open surface is sketched and recorded. The `Left to delivery:` entry is unchanged. |
| DW-P21 After delivery | A screen that was left to delivery is built, and the person asks to reconsider its layout. | The surface is sketched with alternatives and the decision replaces `Left to delivery:`; on an accepted spec `rev` rises with a `## Decision log` line. No production file changes. |
| DW-P9 Decided surface | The Interface section marks one surface as decided and does not propose changing it. | That surface gets no new sketch and its decision is left as it is. |
| DW-P14 Save the medium | The policy file exists, sets no medium, and the person picks `html` and agrees to save it. On a second case the person declines. | With a yes, a `## Design` section is added and the next run asks nothing. With a no, the policy is unchanged. |
| DW-P15 Invented wording | A sketch needs an error message the spec does not give. | The text is marked as a proposal in the sketch, listed in `## Interface`, and confirmed by the person with the decision it belongs to. |
| DW-P16 Reachable location | Sketches are kept out of the repository and no pull request exists yet. | `## Interface` holds no local path. It says the sketch is not yet published, and the location is added once it is. |
| DW-P17 Rendered images | The medium is `html` and images are needed at the policy's widths. | Images come from `scripts/render-sketch.mjs` at those widths. A nonzero exit is reported, and no browser is installed. |
| DW-N1 Build the screen | "Build the signing screen from the spec now." | Do not load `design-work`; this is an implementation request. |
| DW-N2 Backend only | "Plan the new retry policy for the outbound worker." | Do not load `design-work` and write no sketch files. |
| DW-N3 Restyle shipped page | "Make the settings page's spacing tighter." | Do not load `design-work`; it is a direct change to shipped UI, not planned work. |

Pass criteria: sketches stay in the sketch area, every listed surface ends decided or explicitly
deferred with an owner, product preferences come from the person, and the run reports any render or
visual check it could not perform instead of claiming it.
