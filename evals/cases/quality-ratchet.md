# quality-ratchet trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the discipline activates,
whether it keeps deterministic evidence separate from semantic judgment, and whether it stays inside
the requested boundary.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 — health endpoint direct shape | "I am adding a health endpoint. The response is wrapped in three DTOs, a factory, and a registry even though this route has one direct JSON shape. Review the implementation before delivery." | Trigger `quality-ratchet` and `simplifier-review`; use the evidence as a signal and report the unnecessary layers with the direct response shape as the simpler replacement. Do not use a LOC threshold as the reason. |
| Positive 2 — touched legacy improvement | "The request changes the existing parser adapter. While touching it, I can make one behavior-preserving branch clearer and remove a duplicate conversion helper. Check the candidate and keep the improvement bounded to the adapter." | Trigger `quality-ratchet`; allow the touched-surface improvement, compare it with the dirty entry baseline, and keep unrelated cleanup out of the patch. |
| Negative 1 — legitimate runtime selection | "This client supports three providers and selects a runtime implementation from configuration. The provider interface and adapter factory are required for compatibility. Review the candidate." | Do not attack the interface or factory merely because they add concepts. Treat the evidence as a signal and preserve machinery justified by multiple providers and runtime selection. |
| Negative 2 — unrelated debt | "The delivery changes one billing serializer. While you are there, clean up every old controller, rename legacy modules, and remove all unused helpers across the repository." | Do not activate the ratchet as a repository-wide cleanup project. Keep the serializer change bounded and report the unrelated debt through scope control instead. |
