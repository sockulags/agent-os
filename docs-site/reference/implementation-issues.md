---
title: Implementation issues
description: The required delivery-ready output of shape-work and the developer-owned execution choice.
---

# Implementation issues

> This page orients. The canonical contract agents load is
> [`skills/shape-work/references/implementation-issues.md`](https://github.com/sockulags/agent-os/blob/main/skills/shape-work/references/implementation-issues.md).

Research, grilling, and prototypes provide decision evidence. The durable output of shaping is one
or more implementation-ready issues on the configured planning surface.

Shape-work is not complete, and a selected branch is not delivery-ready, until those issues exist.
Parked and rejected branches need no implementation issue.

## Required issue contract

Every issue has a stable `(origin, unit key)` identity and records:

- explicit ready or blocked status using project conventions;
- one coherent independently useful or assessable delivery unit;
- boundaries and non-goals;
- acceptance examples;
- ground truth that can verify the outcome;
- dependencies and their current state;
- linked evidence and settled decisions;
- the requested delivery target;
- open risks without unresolved product choices.

Do not split a unit merely because its parts could use separate commits, sessions, files, or
technical layers. Split for an independently useful or assessable result, different ownership, a
separate migration, a delivery boundary, or a material risk and verification boundary. Keep schema,
API, UI, configuration, errors, and verification with the behavior they support.

## Epic contract

When one shared end result needs an owner, the epic records the shared outcome and acceptance, its
children or delivery units and their reasons, aggregate verification, and the explicit owner of
final verification. A child does not authorize siblings or close the parent; green children are not
aggregate verification. `deliver-work` performs the whole-result check when the request covers the
epic, and `batch-work` reuses the same contract for explicit integrated execution.

Retries search before creating and update existing issues. Dependencies determine the ready or
blocked frontier; they do not determine the execution workflow.

## The developer chooses execution

Any ready issue can be delivered individually with `deliver-work`, including one issue from a larger
sequential graph. `batch-work` consumes an existing dependency-mapped issue set only when the
developer explicitly requests integrated parallel execution. Several issues never imply batch-work
by themselves.

Creating issues is a planning write. It does not authorize product code changes, batch execution,
merge, deployment, or other delivery effects.
