---
title: init-agent-os
description: Install shared agent-os policy or initialize one repository's living defaults.
skill-description: Sets up agent-os globally on a machine, or initializes a repo's living project policy through an interview. User-invoked only, at machine setup or when onboarding a repo. Not for ordinary tasks.
summary: Managed policy setup or repository defaults
---

# init-agent-os

**Bucket:** workflow · **Invocation:** manual · `/agent-os:init-agent-os` or `$init-agent-os`

Sets up managed global policy or seeds one repository's project policy.

`global` verifies plugin visibility, checks drift, and applies the managed policy blocks through the
deterministic script. The explicit invocation authorizes those setup writes.

Repository mode reads existing instructions, README, build files, and CI first. It asks only for
missing material defaults: delivery, verification, design system, planning surface, batch execution,
and durable conventions. It writes the smallest useful policy and shows the resulting diff.

Managed block edits remain script-owned and stop on duplicate or malformed markers.
