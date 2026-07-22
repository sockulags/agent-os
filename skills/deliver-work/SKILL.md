---
name: deliver-work
description: Takes decision-ready intent or a focused fix through a sequential implementation, review, verification, and PR workflow. User-invoked when work is ready to build. Not for exploration or specification-only work (use shape-work).
disable-model-invocation: true
---

# Deliver work

Run one visible step at a time so later work cannot pull attention past the current gate.

1. Read [workflow.md](workflow.md) completely and keep its state contract for the run.
2. Read only the step named by the active work record. With no active record, begin at [steps/01-readiness.md](steps/01-readiness.md).
3. Complete that step's criterion, then follow its single `NEXT` or `HALT` instruction.

The workflow is complete only when the delivery step reports `delivered`, or names the exact blocked transition. A summary, implementation progress, or green tests alone never advance state.
