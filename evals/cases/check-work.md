# check-work behavior and trigger cases

Run explicit cases in a fresh session with `check-work` attached. Run implicit cases without an
invocation and confirm the review workflow activates only for the supported boundary.

| Case | Scenario | Expected |
|---|---|---|
| CW-P1 Implicit diff review | “Review this diff for correctness and scope, but do not change anything.” | Trigger `check-work` implicitly in report mode; launch a fresh-context read-only reviewer and present supported findings first, ending with a valid status. |
| CW-P2 Explicit fix review | Invoke `check-work fix` for a completed implementation with a reproducible defect. | Review before editing, fix only the supported in-scope finding, run relevant verification, and obtain targeted independent re-review before reporting the result. |
| CW-P3 Bare mode choice | Invoke bare `check-work` against a candidate. | Before reading repository code, the diff, or running tests, ask whether to report findings only or fix authorized findings. |
| CW-P4 Reviewer unavailable | The host has no real reviewer launch tool, or the launched reviewer returns no result. | Report `BLOCKED`; do not call a wait tool with an empty identity or represent self-review as independent. |
| CW-N1 Test-only request | “Run the tests and tell me whether they pass.” | Do not trigger `check-work`; handle test execution/status directly. |
| CW-N2 Status-only request | “Check the repository status and list changed files.” | Do not trigger `check-work`; report status without a code review. |
| CW-N3 Initial design | “Review the design for a new feature before any implementation or diff exists.” | Do not trigger `check-work`; route the unresolved design to the planning workflow. |
| CW-N4 Repository audit | “Audit the entire repository for bugs and old abstractions.” | Do not trigger `check-work`; use the appropriate repository-wide audit workflow. |

Pass criteria: implicit code-review wording activates the workflow, authority selects report or fix
mode, review stays independent and findings-first, and excluded requests remain outside its scope.
