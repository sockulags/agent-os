---
name: shape-work
description: Shapes a feature or larger change into a decision-complete spec with required visualization, through an interview. User-invoked at the start of new work, before any plan or code exists. Not for small fixes or work that already has an approved spec.
disable-model-invocation: true
---

# shape-work

Turn a rough idea into a spec the user can approve without follow-up questions. The output routes to
`deliver-work` for one unit or `batch-work` for several frozen units.

## Steps

1. **Read before asking.** Explore the repo and its project policy (design system location, conventions, verify commands) first. When invoked on a chart-work branch, read its map link and canonical decision receipts; preserve those decisions and ask only what the graduated branch left open. Never ask a question the repo or its decision evidence already answers.
2. **Interview one decision at a time.** Present each open decision with a recommendation and the reason for it. Grill until the spec is decision-complete: scope, non-goals, acceptance criteria, affected seams. Collapse into digestible chunks for sign-off rather than one giant questionnaire.
3. **Visualize.** Every feature gets a visualization before the spec is final:
   - Backend feature: a Mermaid flow diagram of the affected flow.
   - Frontend feature: follow [references/mockups.md](references/mockups.md) — read it before producing any mockup, because it defines the design-system bootstrap and the checklist the mockup must pass.
4. **Scale the investment.** Small frontend feature: simple wireframe. Larger feature: an HTML/CSS proposal in the project's existing design system. State the chosen level and its one-sentence justification.
5. **Deliver the spec**: goal, scope, non-goals, acceptance criteria, the visualization, open risks,
   and execution route. One implementation unit routes to `deliver-work`; several decision-complete
   units with stable dependencies and scopes route to `batch-work`. Short enough to scan, complete
   enough that execution needs no new product decisions.

## Hard rules

- The spec is decision-complete or it is not done — every open product question either gets answered in the interview or is listed explicitly as deferred with an owner, because a hidden open question resurfaces later as an implementation guess.
- Frontend mockups use only tokens and components that actually exist in the repo; if no documented design system is found, say so explicitly and keep a minimal new proposal clearly separated from existing facts — never smuggle an invented style in as if it were established.
- Recommendations accompany every question, because an open-ended "what do you want?" pushes the thinking back onto the user instead of costing the agent a proposal.
- shape-work produces documents and diagrams only — no product code, no mutations beyond the spec artifact — because implementation before an approved spec bypasses the checkpoint the spec exists to feed.
