# shape-work

**Bucket:** workflow · **Invocation:** manual · `/agent-os:shape-work` or `$shape-work`

Turns a rough idea into a spec you can approve without follow-up questions. Use it at the start of
new work, before any plan or code exists. Skip it for small fixes and for work that already has an
approved spec. Its output feeds [`deliver-work`](/skills/deliver-work).

## Steps

1. **Read before asking.** Explore the repository and its project policy — design-system location,
   conventions, verify commands — first. When invoked on a graduated
   [`chart-work`](/skills/chart-work) branch, read the map link and the canonical decision receipts,
   preserve those decisions, and ask only what the branch left open. Never ask a question the repo or
   its decision evidence already answers.
2. **Interview one decision at a time.** Present each open decision with a recommendation and the
   reason for it. Grill until the spec is decision-complete: scope, non-goals, acceptance criteria,
   affected seams. Collapse the result into digestible chunks for sign-off rather than one giant
   questionnaire.
3. **Visualize.** Every feature gets a visualization before the spec is final. A backend feature gets
   a Mermaid flow diagram of the affected flow. A frontend feature follows
   [Frontend mockups](/reference/mockups), which defines the design-system bootstrap and the checklist
   the mockup must pass.
4. **Scale the investment.** A small frontend feature gets a simple wireframe; a larger one gets an
   HTML/CSS proposal built in the project's existing design system. State the chosen level and a
   one-sentence justification.
5. **Deliver the spec** — goal, scope, non-goals, acceptance criteria, the visualization, open risks.
   Short enough to scan, complete enough that `deliver-work` needs no new product decisions.

## Hard rules

The spec is decision-complete or it is not done. Every open product question is either answered in
the interview or listed explicitly as deferred with an owner, because a hidden open question
resurfaces later as an implementation guess.

Frontend mockups use only tokens and components that actually exist in the repository. When no
documented design system is found, the skill says so explicitly and keeps a minimal new proposal
clearly separated from existing facts, rather than smuggling an invented style in as established.

Every question carries a recommendation, because an open-ended "what do you want?" pushes the
thinking back onto the user instead of costing the agent a proposal.

shape-work produces documents and diagrams only — no product code, no mutations beyond the spec
artifact — because implementing before an approved spec bypasses the checkpoint the spec exists to
feed.
