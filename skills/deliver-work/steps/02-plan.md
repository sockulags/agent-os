# Step 2: Plan

## Execute

1. Investigate the affected code and conventions before proposing mutations.
2. Define the goal, non-goals, acceptance criteria, exact intended mutations, risks, and verification commands or observable checks.
3. Name the smallest public test seams that cover the important behavior. The checkpoint approves these seams; implementation must not invent a second testing contract.
4. For a tracked frontend feature, read `../../shape-work/references/mockups.md` and include the required mockup. For a tracked backend flow, include a Mermaid flow. Reuse an approved visualization when one exists.
5. Record every reversible assumption explicitly.
6. For tracked work, create `.agent-os/work/<slug>.md` using the workflow frontmatter plus these sections: Intent, Non-goals, Acceptance, Test seams, Intended mutations, Assumptions, Verification, Review receipt. Set `status: awaiting-approval` and `next_step: steps/03-checkpoint.md`.
7. For one-shot work, keep a compact in-memory plan and intended file list; create no artifact.
8. For batch-owned work, copy goal, non-goals, acceptance, test seams, authorized scope, verification,
   and delivery boundary from the frozen task definition. Record the six batch identity fields in
   the work record. A discovery that expands any definition field returns to the batch checkpoint
   instead of changing the worker plan.

## Completion criterion

Every acceptance criterion is testable, every mutation maps to the goal, and no unresolved decision is hidden as an assumption.

`NEXT`: read [03-checkpoint.md](03-checkpoint.md) completely.
