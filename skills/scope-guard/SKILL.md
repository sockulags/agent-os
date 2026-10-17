---
name: scope-guard
description: Scope creep in a task already in progress, such as an extra cleanup, the same bug elsewhere, a new dependency, or a public API change. Sorts each discovery into required, adjacent, or unrelated, keeps unrelated work out of the change, and asks before anything that needs a new decision. Use when the user says things like I noticed this too, should I fix that as well, is this okay to include in this PR, or handle it however makes sense. Not for scoping a feature before work starts, finding a root cause, or checking work that is already in scope.
---

# Guard scope

Keep the active change aligned with the developer's requested outcome. The direct request,
accepted spec, and project policy define the boundary. Classify every discovery on both axes before
editing:

- **Relation, required:** the requested outcome cannot work or be verified without it. It normally
  belongs in the current mission.
- **Relation, adjacent:** useful improvement that is relevant but not needed now. Offer it as a
  valuable follow-up only when it is actionable.
- **Relation, unrelated:** no relevant connection to the requested outcome. Leave it out and do
  not manufacture a proposal.
- **Mandate, covered:** the existing request and policy cover the work. Continue within the
  covered boundary; do not ask for a second approval.
- **Mandate, new decision or external action:** the existing authority does not cover it. Ask a
  focused question only when the required work cannot proceed without that decision or action.

Risk controls how covered work is implemented and verified. Risk can reveal a missing decision, but
belonging to a risk area does not automatically require new permission. Check architecture, public
interfaces, dependencies, and delivery risk against settled decisions and boundaries. Ask when a
material choice has no coverage.

A required discovery with covered mandate is included. A required discovery that changes a product
contract or explicit boundary returns to `plan-work`. Adjacent work does not delay authorized
delivery, and unrelated work gets no invented proposal. A motivated split of required work goes
through `shape-work`.

Behavior-preserving extraction within the touched surface is allowed when it clarifies responsibility
or reuses an existing contract. Do not classify every new helper as an architecture change.

For an actionable adjacent item, search for an existing issue first. If the request or project
policy authorizes follow-up issue creation, and no explicit read-only instruction forbids it, create
or update one concrete follow-up with its problem, impact, and acceptance condition. Otherwise
collect worthwhile follow-ups into one question with a recommended disposition and draft content.
Do not create tickets for rejected preferences or delay authorized delivery while waiting on an
optional backlog decision. Report any unresolved delivery blocker separately.

Tracker readiness or an existing issue does not grant mutation authority. Write tracker changes only
when the request or project policy covers them; otherwise keep the correction local and report the
pending delta.

Before delivery, inspect the diff for unrelated edits. Preserve pre-existing developer work;
scope control never grants permission to revert it.
