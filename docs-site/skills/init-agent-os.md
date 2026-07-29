# init-agent-os

**Bucket:** workflow · **Invocation:** manual · `/agent-os:init-agent-os` or `$init-agent-os`

Sets up managed global policy or seeds one repository's project policy.

`global` verifies plugin visibility, checks drift, and applies the managed policy blocks through the
deterministic script. The explicit invocation authorizes those setup writes.

Repository mode reads existing instructions, README, build files, and CI first. It asks only for
missing material defaults: delivery, verification, design system, planning surface, batch execution,
and durable conventions. It writes the smallest useful policy and shows the resulting diff.

Managed block edits remain script-owned and stop on duplicate or malformed markers.
