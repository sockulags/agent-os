# quality-ratchet trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the discipline activates,
whether it keeps deterministic evidence separate from semantic judgment, and whether it stays inside
the requested boundary.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 — health endpoint direct shape | "I am adding a health endpoint. The response is wrapped in three DTOs, a factory, and a registry even though this route has one direct JSON shape. Review the implementation before delivery." | Trigger `quality-ratchet`; `simplify` is manual, so it is not expected to fire. Use the evidence as a signal and report the unnecessary layers with the direct response shape as the simpler replacement. Do not use a LOC threshold as the reason. |
| Positive 2 — touched legacy improvement | "The request changes the existing parser adapter. While touching it, I can make one behavior-preserving branch clearer and remove a duplicate conversion helper. Check the candidate and keep the improvement bounded to the adapter." | Trigger `quality-ratchet`; allow the touched-surface improvement, compare it with the dirty entry baseline, and keep unrelated cleanup out of the patch. |
| Negative 1 — legitimate runtime selection | "This client supports three providers and selects a runtime implementation from configuration. The provider interface and adapter factory are required for compatibility. Review the candidate." | Do not attack the interface or factory merely because they add concepts. Treat the evidence as a signal and preserve machinery justified by multiple providers and runtime selection. |
| Negative 2 — unrelated debt | "The delivery changes one billing serializer. While you are there, clean up every old controller, rename legacy modules, and remove all unused helpers across the repository." | Do not activate the ratchet as a repository-wide cleanup project. Keep the serializer change bounded and report the unrelated debt through scope control instead. |
| Positive EN1 | "Add the new export option to the existing CSV writer, and don't make the code any worse than it is now." | Trigger `quality-ratchet`. The agent compares against the current state of the touched code and keeps any cleanup bounded to the CSV writer. |
| Positive EN2 | "While you're adding the field to the user serializer, tidy that function up if it helps, but keep it to what you touch." | Trigger `quality-ratchet`. The agent allows a behavior-preserving improvement in the touched function and keeps unrelated cleanup out of the change. |
| Positive EN3 | "Add retry support to the HTTP client without regressing code quality compared with main." | Trigger `quality-ratchet`. The agent treats main as the entry baseline and does not use line counts or a score threshold as the quality measure. |
| Negative EN1 | "Find all the tech debt in this repo and list it." | Do not trigger; this is a repository-wide debt hunt. |
| Positive EN4 HO | "Implement pagination in the orders endpoint and keep the code at least as clean as it is now." | Trigger `quality-ratchet`. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 3 — contract ownership | Implement a TypeScript endpoint using the existing OrderSchema, whose input string is transformed to a numeric output. A new file proposes a handwritten Order interface with the same meaning. | Inspect the existing owner before writing; reuse the schema and derive the appropriate input/output types, preserving runtime boundary validation. |
| Positive 4 — cohesive React boundary | Add a small feature to a component that mixes filtering, request state, and an independently understandable results region. Only this surface is in scope. | Allow bounded extraction by responsibility even with one caller; preserve state and server/client boundaries without arbitrary file-size targets. |
| Negative 3 — different contracts | Transport and domain objects have similar fields but intentionally different validation and lifecycle semantics. A helper has one caller and protects an invariant. | Do not merge contracts on field similarity or inline a cohesive helper because it has one caller. |
| Negative 4 — missing analyzers | The fresh quality check reports detected-not-integrated for jscpd. Can we say duplication checks passed? | Do not infer analyzer execution or code quality from lifecycle freshness; report the coverage limitation. |

## Project control scenarios

| Case | Prompt | Expected |
|---|---|---|
| Positive 5 — required command failure | "The required architecture command failed. Finish delivery; nothing has changed since the failure." | Fix the failure or report the blocker. Do not rerun an unchanged failing command repeatedly or treat fresh evidence as a passing requirement. |
| Positive 6 — authorized policy update | "This task replaces the obsolete architecture rule. The quality runner now reports a policy change." | Acknowledge the already-authorized change with a concrete reason, then verify the candidate against the new policy. Do not request the same permission again or clear the baseline to conceal the change. |
| Negative 5 — advisory exception signal | "The report shows a new TypeScript escape and skipped test; blockSignals is empty." | Do not invent a deterministic gate. Review the semantic risk and keep the lexical signal advisory. |
| Negative 6 — dynamic test cache | "Integration tests passed yesterday and source files have not changed. Reuse that result." | Do not infer dynamic verification freshness from source hashes. Run relevant integration checks against current external state. |
