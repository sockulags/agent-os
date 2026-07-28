# Review loop

The independent review loop runs from step 5 of [`deliver-work`](/skills/deliver-work), after
self-review has produced one frozen target and before completion verification. It is the part of the
workflow that assumes the implementer is the worst possible judge of its own diff.

## Review depth

Depth is proportional to risk. A small mechanical fix needs self-review plus fresh verification, and
adds independent review only when risk, policy or the user requires it. A normal change runs blind and
adversarial reviewers independently. A complex, easily misread or architectural change runs blind,
adversarial and simplifier reviewers in parallel. A security-critical or irreversible change uses the
complex path and requires a human decision before disputed findings are fixed or the work is
delivered.

## Freezing the candidate

Identify one frozen review target: a commit SHA, or a saved diff plus a hashed worktree state. Every
reviewer receives the same inputs — the raw task or spec, the acceptance criteria, the project policy,
the candidate target, and the relevant verification commands.

Recheck the recorded hash before any fixer mutation. Drift invalidates the reports and returns the
work to implementation.

Implementer reasoning, suspected defects, expected findings and other reviewers' output stay out of
reviewer context. Reviewers are read-only.

Launch every required reviewer before reading any result. If independent contexts are unavailable,
write one prompt artifact per required role under `.agent-os/review-prompts/<slug>/` and halt so the
user can run them separately. Implementer self-review never substitutes for an independent role.

## The three roles

**Blind reviewer.** Trace the raw request and every acceptance criterion to observable behavior in the
candidate. Look for missing requirements, unintended behavior, incorrect assumptions and verification
gaps. Judge the artifact, not the implementation story.

**Adversarial reviewer.** Try to falsify correctness with counterexamples appropriate to the task:
boundary values, malformed inputs, state transitions, ordering, concurrency, failure recovery,
permissions, alternative interpretations. A reproducible case beats a speculative warning.

**Simplifier.** Find behavior-preserving reductions in code, dependencies, abstractions, branches or
duplicated tests, keeping product behavior and approved architecture fixed. Report simplifications as
findings; do not rewrite the candidate.

## Classification

The orchestrator owns classification. Every report is normalized to:

```text
ID; source; claim; evidence or reproduction; affected acceptance criterion;
severity; confidence; classification; recommended action
```

Severity is `blocker`, `major` or `minor`. Classification is exactly one of:

- `validated` — reproduced or directly supported; eligible for the fixer.
- `rejected` — contradicted by evidence, or based on an invalid premise.
- `duplicate` — same root cause as another finding; merge the evidence.
- `out-of-scope-follow-up` — useful, but unnecessary for current acceptance.
- `decision-needed` — changes intent, architecture, risk, or another human decision.
- `cannot-reproduce` — plausible but not currently supported; reported as uncertainty.

Classification follows evidence, not majority vote: one reproducible finding outranks several
unsupported opinions. A `decision-needed` finding stops the loop when proceeding would choose product
intent or materially expand scope.

## Fixing

One fixer receives only the validated findings, their evidence, the frozen candidate and the project
policy. For each finding it reproduces first, adds a regression check when practical, makes the
smallest sufficient change, and records the result. User-owned work is preserved, and rejected,
follow-up and undecided findings stay out of the diff.

Then run the original verification plus every new regression check, and request at most one targeted
re-review covering the fixes and their immediate interactions. New material findings route through
classification once; anything unresolved gets surfaced rather than starting an unbounded loop.

## Out-of-scope follow-ups

After the fixer and any targeted re-review, collect every evidence-supported
`out-of-scope-follow-up` from the full review, including findings from the simplifier. They stay out
of the current diff and never go to the fixer.

Before review can complete, write each candidate to the review receipt as
`awaiting-follow-up-choice`, then show one concise list with a proposed issue title, the value of the
finding and its evidence. Ask once whether to create issues for the listed findings or leave them
unfiled; if there are several, the user can select a subset. Halt before mutating the tracker or
moving the work to `reviewed`.

For each approved issue, first check the project's planning surface for a duplicate. Then create or
link one ordinary backlog issue carrying the current work item or PR and finding ID as its origin.
This capture does not prioritize or implement the issue. Record the disposition as
`issue-created: <link>` or `existing-issue: <link>`. Record declined candidates as
`left-unfiled: user choice`.

Rejected, duplicate and unsupported findings do not trigger the question. With no remaining
out-of-scope follow-up, review continues without it.

## The receipt

Before leaving review, record:

```text
target: baseline + file list + snapshot hash
roles: required, completed, failed
findings: ID -> classification -> disposition
fixer: accepted IDs and resulting checks
targeted re-review: not-needed | pass | concerns
unresolved: none | exact blocker/decision
```

The receipt is complete only when every finding maps to fixed, rejected, deferred, issue-created,
existing-issue, left-unfiled, decision-needed or unresolved. For an out-of-scope follow-up,
`deferred` does not substitute for the user's choice: until that choice is recorded it remains
`awaiting-follow-up-choice` and keeps review incomplete. Fresh completion evidence belongs to the
verification step, not to this receipt.
