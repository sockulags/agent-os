# Chart-work Prototype and Shape-work Handoff Design

## Problem

`shape-work` links directly to its mockup contract, while `chart-work` only describes prototypes
inside its general elicitation reference. Prototype evidence therefore lacks an equally visible,
stable artifact-link contract.

`chart-work` also closes a canonical decision ticket once its evidence supports a decision. The
current graduation text may point at that closed ticket, but it does not require a live work item
that a user or fresh agent can naturally continue with through `shape-work`.

## Decision

Add a dedicated prototype reference and link it directly from `chart-work`. A prototype decision
must record a stable, inspectable artifact link or path, verification evidence, the observed user
reaction, and the user's judgment. Frontend prototypes also follow the existing `shape-work`
mockup contract so both workflows share the repository-design-system bootstrap and fidelity rules.

When a bounded branch graduates, `chart-work` creates a distinct open shape-work handoff before it
closes the source decision ticket. The handoff records:

- the bounded goal and non-goals;
- the map and source decision-ticket links;
- the relevant decision receipts and prototype artifacts;
- the product questions that remain open;
- the explicit next action to run `shape-work` on the handoff.

The map's `Graduated branches` entry points to this open handoff rather than treating the closed
decision ticket as the next work item. The `chart-work` completion message names the same linked
handoff and next command. It does not start `shape-work`; the transition remains an explicit
user-controlled checkpoint.

## Boundaries

- Keep the decision ticket canonical for the decision it resolved.
- Do not reopen or repurpose a closed decision ticket as shaping work.
- Do not authorize product implementation through graduation.
- Keep tracker and local-file representations semantically equivalent.
- Do not change `shape-work` beyond the direct shared-reference relationship needed by this handoff.

## Verification

Strengthen the versioned behavior cases so a fresh session must:

- produce and record an inspectable prototype artifact;
- create exactly one durable shape-work handoff before closing a graduating decision;
- link the map to the open handoff;
- state the explicit next `shape-work` action;
- let a blind fresh `shape-work` session continue without conversation history or re-litigating
  settled decisions;
- remain idempotent on retry.
