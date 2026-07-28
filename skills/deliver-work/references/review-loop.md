# Independent review loop

Use this only from deliver-work Step 5, after self-review has produced one frozen target and before completion verification.

## Choose review depth

- **Small mechanical fix:** self-review plus fresh verification; add independent review when risk, policy, or the user requires it.
- **Normal change:** run blind and adversarial reviewers independently.
- **Complex, easily misread, or architectural change:** run blind, adversarial, and simplifier reviewers in parallel.
- **Security-critical or irreversible change:** use the complex path and require a human decision before fixing disputed findings or delivering.

## Freeze the candidate

Identify one frozen review target: a commit SHA or a saved diff plus hashed worktree state. Give every reviewer the same raw task/spec, acceptance criteria, project policy, candidate target, and relevant verification commands. Recheck the recorded hash before any fixer mutation; drift invalidates the reports and returns to implementation.

Keep implementer reasoning, suspected defects, expected findings, and other reviewers' output out of reviewer context. Reviewers are read-only and receive the raw request/spec, acceptance criteria, project policy, candidate target, and relevant verification commands.

Launch every required reviewer before reading any result. If independent contexts are unavailable, write one prompt artifact per required role under `.agent-os/review-prompts/<slug>/` and HALT for the user to run them separately. Implementer self-review never substitutes for an independent role.

## Independent reviewer roles

### Blind reviewer

Trace the raw request and every acceptance criterion to observable behavior in the candidate. Look for missing requirements, unintended behavior, incorrect assumptions, and verification gaps. Judge the artifact, not the implementation story.

### Adversarial reviewer

Try to falsify correctness with counterexamples appropriate to the task: boundary values, malformed inputs, state transitions, ordering, concurrency, failure recovery, permissions, and alternative interpretations. Prefer a reproducible case over a speculative warning.

### Simplifier

Find behavior-preserving reductions in code, dependencies, abstractions, branches, or duplicated tests. Keep product behavior and approved architecture fixed. Report simplifications as findings; do not rewrite the candidate.

## Normalize and classify findings

The orchestrator owns classification. Normalize every report to:

```text
ID; source; claim; evidence or reproduction; affected acceptance criterion;
severity; confidence; classification; recommended action
```

Use `blocker`, `major`, or `minor` severity and exactly one classification:

- `validated`: reproduced or directly supported; eligible for the fixer.
- `rejected`: contradicted by evidence or based on an invalid premise.
- `duplicate`: same root cause as another finding; merge the evidence.
- `out-of-scope-follow-up`: useful but unnecessary for current acceptance.
- `decision-needed`: changes intent, architecture, risk, or another human decision.
- `cannot-reproduce`: plausible but not currently supported; report as uncertainty.

Classification follows evidence, not majority vote. One reproducible finding outranks several unsupported opinions. Stop for `decision-needed` when proceeding would choose product intent or materially expand scope.

## Fix accepted findings

Give one fixer only the validated findings, their evidence, the frozen candidate, and project policy.

For each finding, reproduce it first, add a regression check when practical, make the smallest sufficient change, and record the result. Preserve user-owned work and leave rejected, follow-up, and undecided findings out of the diff.

Run the original verification plus every new regression check. Then request at most one targeted re-review covering the fixes and their immediate interactions. Route new material findings through classification once; surface anything unresolved instead of starting an unbounded review loop.

## Decide out-of-scope follow-ups

After the fixer and any targeted re-review, collect every evidence-supported
`out-of-scope-follow-up` from the full review, including simplifier findings. Keep them out of the
current diff and do not send them to the fixer.

Before completing review, write each candidate to the review receipt as
`awaiting-follow-up-choice`, then present one concise list with a proposed issue title, the finding's
value, and its evidence. Ask the user once whether to create issues for the listed findings or leave
them unfiled; when there are several, the user may choose a subset. HALT before any tracker mutation
and before setting the work to `reviewed`.

After the user decides:

- For each approved issue, check the project's planning surface for a duplicate, then create or link
  one ordinary backlog issue with the work item or PR and finding ID as origin. Capturing the issue
  does not prioritize or implement it.
- For each declined issue, record `left-unfiled: user choice`.
- Record an approved issue as `issue-created: <link>` or `existing-issue: <link>`.

Do not ask about rejected, duplicate, or unsupported findings. If no
`out-of-scope-follow-up` remains after classification, continue without this decision.

## Review receipt

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
existing-issue, left-unfiled, decision-needed, or unresolved. For an
`out-of-scope-follow-up`, `deferred` does not substitute for the user's choice: until that choice is
recorded it remains `awaiting-follow-up-choice` and keeps review incomplete. Fresh completion
evidence belongs to Step 6, not this receipt.
