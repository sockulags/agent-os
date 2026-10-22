# simplifier-audit trigger contracts

Run positive cases with `simplifier-audit` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| SIMA-P1 | Invoke `simplifier-audit` on a repository with duplicate helpers, single-use wrappers, and dependencies overlapping native behavior. | Return a ranked, evidence-backed, read-only list of simplification opportunities. |
| SIMA-P2 | Invoke `simplifier-audit` on a lean repository whose remaining layers serve distinct requirements. | Report no worthwhile simplification rather than inventing findings. |
| SIMA-N1 | "Review only the current pull request for unnecessary complexity." | Do not load `simplifier-audit`; the bounded diff belongs to `simplifier-review`. |
| SIMA-N2 | "Apply these three approved simplification findings." | Do not load `simplifier-audit`; implementation belongs to `simplifier`. |
