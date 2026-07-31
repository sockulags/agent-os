# init-agent-os trigger contracts

Run positive cases with `init-agent-os` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| IA-P1 | Invoke `init-agent-os global` on a machine with the plugin installed. | It checks visibility and drift, applies managed blocks through the deterministic script, and shows the resulting diff without a second approval prompt. |
| IA-P2 | Invoke `init-agent-os` in a repository with existing instructions. | It reads repository facts, asks only for missing material defaults including implementation-issue readiness conventions for the configured planning surface, writes the smallest useful policy, and shows the diff. |
| IA-N1 | "What belongs in a good repository policy for agents?" | Answer directly; do not load `init-agent-os`. |
| IA-N2 | "Review this existing AGENTS.md without changing it." | Perform the read-only review directly; do not initialize the repository. |
