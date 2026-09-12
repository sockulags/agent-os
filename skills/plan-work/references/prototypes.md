# Prototype evidence

A prototype exists to settle a decision, not to become an accidental product implementation.

## Decide whether to experiment

Propose a prototype when an unresolved assumption could change the solution and executing the
smallest experiment is cheaper or more decisive than further reading or discussion. Examples are
uncertain transaction behavior, integration limits, a performance hypothesis, or competing UI
interactions the developer needs to try. Existing evidence that already settles the question, a
routine implementation, or a preference answerable directly needs no prototype.

Within an authorized planning or implementation task, run a small isolated local experiment when
it can answer that question without new external effects or product changes. For UI choices, build
comparable alternatives and ask the developer to judge them. Announce the question, smallest
artifact, observation that would settle it, and a bounded effort budget before starting; no
separate approval is needed inside existing authority. Ask before crossing that authority, not
merely because the artifact is called a prototype.

Stop when the evidence is sufficient or the budget is exhausted. Inconclusive evidence leaves the
decision open; report the remaining uncertainty and recommend the next action instead of silently
growing the experiment. Keep experimental code isolated from production paths. Retaining useful
evidence does not promote code to production; normal implementation and review still apply.

## Capture the result

Build the smallest comparison that makes the contested behavior observable. Keep alternatives easy
to compare and ask the developer to perform the shortest meaningful task.

Record:

```text
## Prototype evidence
- Question:
- Artifact: <stable link or repository-relative path>
- How it was exercised:
- Observation:
- Decision and rationale (developer judgment for product preferences):
- Open uncertainty:
```

Keep the artifact inspectable while the decision depends on it. Frontend prototypes also follow the
shared [mockup guidance](../../shape-work/references/mockups.md).
