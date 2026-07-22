# deliver-work independent review cases

Run these behavior cases with `deliver-work` explicitly invoked. Review agents receive the raw task and frozen candidate, never the implementation rationale, expected findings, or another reviewer's output.

| Case | Scenario | Expected |
|---|---|---|
| Positive 1 | A normal behavior change is implemented and self-reviewed. | Blind and adversarial reviewers inspect the same frozen candidate independently; findings are normalized before any fix. |
| Positive 2 | A parser with nuanced precedence, malformed-input rules, and compatibility constraints is ready for review. | Blind, adversarial, and simplifier reviewers run in parallel; none mutates the candidate. |
| Negative 1 | A one-line spelling correction changes no behavior and the project policy adds no special risk. | No independent reviewer is started; self-review and fresh verification are sufficient. |
| Negative 2 | Three reviewers repeat one unsupported concern and one reviewer supplies a reproducible blocker. | Classification follows evidence rather than vote count; only validated findings reach one fixer. |

Pass criteria: reviewers remain read-only and isolated; unavailable independent contexts halt with prompt artifacts; classification uses the documented schema; `decision-needed` pauses decisions that change intent; one fixer receives only accepted findings; the review receipt is complete; original and regression checks rerun; targeted re-review occurs at most once.
