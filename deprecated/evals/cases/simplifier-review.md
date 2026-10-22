# simplifier-review trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when
a concrete implementation diff reaches review.

| Case | Prompt | Expected |
|---|---|---|
| SIMR-P1 | "Review this completed diff. It adds a factory, wrapper, and configuration for one implementation." | Trigger `simplifier-review` and report actionable simplification findings without editing. |
| SIMR-P2 | "Before deliver-work verifies this candidate, review whether the new dependency and helper are actually necessary." | Trigger `simplifier-review` as part of the implementation review. |
| SIMR-N1 | "Audit the entire repository for old abstractions and unused dependencies." | Do not trigger; route the repo-wide request to `simplifier-audit`. |
| SIMR-N2 | "Investigate why this parser crashes on malformed input." | Do not trigger; this is root-cause diagnosis, not simplification review. |
