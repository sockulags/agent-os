# Decision map

The configured planning surface owns the map, its canonical decision tickets, claims, and
handoffs. With no project convention, use:

```text
planning/<plan-slug>/map.md
planning/<plan-slug>/decisions/<ticket-slug>.md
planning/<plan-slug>/shape-work/<branch-key>.md
```

## Map

Keep the map low-resolution and rebuildable from its tickets. A plan summary is optional when the
request is already clear; it is not a universal approval gate.

```text
## Outcome
## Boundaries
## Plan summary
## Decisions
- <ticket> -> <decision gist> (<link>)
## Claims
- <ticket> -> <claimant and live-version token>
## Open frontier
## Fog
## Reconsiderations
- <ticket> -> <active reconsideration> (<link>)
## Shaping handoffs
- <branch> -> <shape-work handoff> (<link>)
## Delivery-ready branches
- <branch> -> <implementation issues and frontier> (<links>)
## Spawned work
```

The map orients. It does not duplicate ticket evidence. Every link is a stable pointer to the
canonical source, and retries update the same entry instead of creating a competing plan.

## Decision tickets

Every ticket states one question, why it matters, the evidence needed, and its dependencies. Choose
the evidence path that fits:

- `research`: repository evidence, primary sources, or measurements;
- `prototype`: a comparison that makes contested behavior observable;
- `grilling`: a product trade-off the developer must decide;
- `task`: a prerequisite needed before the decision can be stated.

Identity is `(origin map, ticket key)`. An open, unblocked, unclaimed ticket is on the frontier.
Claim it before working. A claim records the stable ticket identity, claimant, and live-version
token (plus the planning surface's timestamp when available). Re-read live state before writing,
release or resolve the claim explicitly, and preserve concurrent ticket results.
Independent frontier tickets may be worked in parallel only when the developer or host explicitly
provides the workers; a map with parallel possibilities never starts them automatically.

Resolve a ticket with:

```text
## Decision
## Evidence
## Rejected alternatives
## Consequence
## New work
## Open risks
## Resolution history
### Prior resolution
### Reconsideration
- Decision under review:
- Why now:
- Question still open:
- Status: open | resolved
- Outcome: confirmed | replaced
- Replacement decision: <link, only after a new decision>
```

The prior resolution remains intact and addressable. A reconsideration is a new, stable record with
identity `(origin map, ticket key, reconsideration key)`. It is visible in `## Reconsiderations` and
uses the same claim, dependency, frontier, and concurrent-write rules as any other ticket. Do not
register a replacement merely because a ticket was reopened.

Decision links, acceptance, and boundaries identify potentially affected work. A link alone does
not pause it: pause only the branch with actual impact, while independent authorized work continues.

## Shape-work handoff

When a branch's remaining product choices fit one bounded shaping session, create or reuse one
handoff. Its identity is `(origin map, branch key)`:

```text
## Shape-work handoff
Origin map: <link or id>
Branch key: <stable key>
Canonical plan: <link to the map or decision ticket>

## Outcome
## Boundaries
## Settled decisions
## Evidence and prototypes
## Questions left
## Reconsideration impact
```

The handoff links canonical evidence; it is not a copied plan or a competing specification. Search before creating so retries reuse the same handoff. Update links idempotently, preserve concurrent
entries, and reconcile the handoff and map only after `shape-work` materializes implementation
issues and their ready or blocked frontier. The handoff moves the branch to shaping, not to `delivery-ready`.

A selected branch in shaping keeps the map open. Close the plan only when every selected path is
delivery-ready, parked, or ruled out and no Fog or active reconsideration remains.
