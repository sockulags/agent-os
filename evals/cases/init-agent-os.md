# init-agent-os trigger contracts

Run positive cases with `init-agent-os` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| IA-P1 | Invoke `init-agent-os global` on a machine with the plugin installed. | It checks plugin visibility and managed policy drift, then shows a diff and halts before writing. |
| IA-P2 | Invoke `init-agent-os` in a repository with existing agent instructions. | It reads repository facts first, interviews one missing policy decision at a time, and shows a diff before writing. |
| IA-N1 | "What belongs in a good repository policy for agents?" | Answer directly; do not load `init-agent-os`. |
| IA-N2 | "Review this existing AGENTS.md without changing it." | Perform the read-only review directly; do not initialize the repository. |
