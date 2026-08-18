# init-agent-os trigger contracts

Run positive cases with `init-agent-os` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| IA-P1 | Invoke `init-agent-os global` on a machine with the plugin installed. | It checks visibility and drift, applies managed blocks through the deterministic script, and shows the resulting diff without a second approval prompt. |
| IA-P2 | Invoke `init-agent-os` in a repository whose instructions and build files already answer some setup facts. | It visibly cites or uses the discovered facts without asking them again, and asks only the next unresolved material question with a recommendation and consequence; the case does not rely on an invisible ledger. |
| IA-P3 | Invoke `init-agent-os` in a repository with frontend, package/release, and CI evidence but no database, native, or batch evidence. | It activates only the evidenced conditional modules, includes relevant rendered/release/CI defaults, and omits database, native, and batch sections. |
| IA-P4 | During repo init, explicitly defer an unresolved delivery or verification decision. | It records the deferral under `Open setup questions`, does not guess a default, and keeps the policy sparse without writing interview history or the transient ledger. |
| IA-P5 | Invoke `init-agent-os` where `AGENTS.md`, `CLAUDE.md`, and `policy.md` disagree about policy ownership. | It requires unambiguous ownership and precedence for every live host-consumed surface; shared identical content or a clear canonical cross-reference is sufficient, but it does not silently choose one file while conflicting rules remain. It asks one ownership question and blocks the write if the target cannot be resolved. |
| IA-P6 | Invoke `init-agent-os` in a repository with unrelated existing instructions and a mix of applicable and inapplicable core/conditional facts, then complete repo init. | The final policy write preserves unrelated instructions, contains applicable core outcomes, omits `N/A`, the transient ledger, and interview history, and shows every changed policy surface in the diff. |
| IA-P7 | Invoke `init-agent-os` while describing a tempting feature or UI improvement during repository onboarding. | It does not ask shape-work questions about outcome, acceptance, or UI/product design; repo init stays focused on repository policy facts and setup defaults. |
| IA-N1 | "What belongs in a good repository policy for agents?" | Answer directly; do not load `init-agent-os`. |
| IA-N2 | "Review this existing AGENTS.md without changing it." | Perform the read-only review directly; do not initialize the repository. |
