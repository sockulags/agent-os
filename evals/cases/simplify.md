# simplify trigger and behavior cases

Run positive cases with `simplify` explicitly invoked and negative cases in a fresh session without
an invocation. The skill is manual-only; `check-work` and `deliver-work` apply its review mode as
their simplification lens.

| Case | Scenario | Expected |
|---|---|---|
| SIM-P1 Apply layers | Invoke `simplify apply` on a diff that adds a wrapper, factory, and configuration for one fixed implementation. | Remove the unjustified layers while preserving behavior, inspect the final diff, run the smallest relevant checks, and report what was removed. |
| SIM-P2 Apply reuse | Invoke `simplify apply` on code that duplicates an existing project helper and adds a new dependency for native platform behavior. | Reuse the helper, use the native behavior, and remove the duplicate code and dependency. |
| SIM-P3 Review diff | Invoke `simplify review` on a completed diff that adds a factory, wrapper, and configuration for one implementation. | Report ranked findings with location, unnecessary complexity, and simpler replacement without editing files; no invented line-savings total. |
| SIM-P4 Review clean diff | Invoke `simplify review` on a diff whose layers each serve a distinct current requirement. | Report `No simplification findings.` instead of inventing findings. |
| SIM-P5 Audit repository | Invoke `simplify audit` on a repository with duplicate helpers, single-use wrappers, and dependencies overlapping native behavior. | Run the bundled audit-evidence script without installing missing tools, read each candidate's usages, and return a short ranked, evidence-backed, read-only list. |
| SIM-P6 Audit lean repository | Invoke `simplify audit` on a lean repository whose remaining layers serve distinct requirements. | Report that the repository is already simple rather than inventing findings. |
| SIM-P7 Bare invocation | Invoke bare `simplify` on the current diff without saying whether files may change. | Use review mode and report findings first; do not edit files. |
| SIM-N1 Ordinary implementation | "Implement the approved report export feature." | Do not load `simplify`; this is ordinary implementation without explicit invocation. |
| SIM-N2 Code golf | "Rewrite this readable loop as the shortest possible one-liner regardless of clarity." | Do not load `simplify`; code golf is outside the skill. |
| SIM-N3 Root cause | "Investigate why this parser crashes on malformed input." | Do not load `simplify`; this is root-cause diagnosis, not simplification. |
| SIM-N4 EN unprompted audit | "Audit the entire repository for old abstractions and unused dependencies." | Do not load `simplify` implicitly; the skill is manual, so the agent may mention `simplify audit` but does not run its procedure without an invocation. |

Pass criteria: the mode matches the request and defaults to a read-only mode when file changes are
not authorized; required behavior, public contracts, and cohesive named responsibilities are
preserved; fewer lines is never the goal; review and audit never edit files; an already simple
target is reported as such.
