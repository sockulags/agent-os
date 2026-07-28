# Evals

Skills are prompts, and prompts regress silently. The eval suite exists so that a change to a
description can be shown not to have broken invocation.

## Layout

`evals/cases/` holds the versioned trigger and behavior cases. Every discipline skill has at least two
positive and two negative cases: positive cases are naive prompts that must activate the skill,
negative cases are adjacent prompts that must not. Workflow skills add non-invocation cases — proving
they stay dormant until invoked — plus sequential-gate cases that check the workflow halts where it is
supposed to.

`evals/RESULTS.md` holds the compact versioned evidence: date, agent, session type, Superpowers
status, case, and pass or fail.

`evals/runs/` holds raw logs and is gitignored.

## Session hygiene

A result is only usable as acceptance evidence when the session's Superpowers status is known. Results
from sessions with unknown status are invalid, because an unrelated framework in the same context can
supply the behavior being tested and make a broken skill look healthy.

Both platforms count separately. A case that passes in Claude Code says nothing about Codex, since
invocation gating is implemented differently on each — `disable-model-invocation` versus
`policy.allow_implicit_invocation`.

## Forward tests

For complex behavior, trigger cases are not enough. A forward test gives a fresh agent the raw task
and the artifact — never the diagnosis, never the expected answer — and checks that it behaves
correctly. This is the only test that catches a skill which reads well and produces nothing.

## Where evals fit in the definition of done

A skill is not finished until structural validation passes, its trigger cases pass on both platforms,
and any complex behavior has a passing forward test. See
[writing-skills](/skills/writing-skills#definition-of-done).
