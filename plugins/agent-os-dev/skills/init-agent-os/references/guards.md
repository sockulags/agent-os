# Guards configuration

`.agent-os/guards.json` tells the agent-os-dev guard hooks what to protect. The hooks run
`quality-ratchet/scripts/guards.mjs`. It reads only this file, Git, and the intent files. It never
runs a command the repository declares, so it needs no trust step. Without the file, the hooks do
nothing.

```json
{
  "schema": 1,
  "protectedPaths": ["migrations/**", ".github/workflows/**"],
  "frozen": ["intents/*/intent.md", "intents/*/spec.md"],
  "secretScan": true
}
```

- `protectedPaths`: globs relative to the repository root. An agent edit to a matching path is
  blocked with a message asking the agent to get the developer's explicit go-ahead. `*` matches within
  one path segment and `**` across segments.
- `frozen`: globs for accepted intent and spec files. While a quality-ratchet delivery baseline is
  active in the session, an edit to a matching file whose frontmatter `status` is `accepted` is
  blocked, because delivery never changes the decisions it delivers. Planning sessions, which have no
  delivery baseline, can still change them through a review.
- `secretScan`: when `true`, a `git commit` run by the agent is blocked if the staged diff adds a
  line that looks like a private key, a cloud or provider access key, or an assignment of a long
  literal to a name such as `password`, `secret`, `token`, or `api_key`. A false positive is resolved
  by the developer, not by rewording the secret.

The guards cover the agent's file-edit tools (Edit, Write, MultiEdit, NotebookEdit, and Codex
`apply_patch`) and `git commit`. They do not inspect other shell commands, so a shell redirect into
a protected path is not caught; they reduce mistakes and are not a sandbox. Paths compare without
case on Windows and macOS. A malformed `guards.json` blocks every edit except the one that repairs it.

Locked tests are not configured here. `diagnose-before-fix` locks one with
`node <quality-ratchet>/scripts/guards.mjs lock-test <path>` after committing it and unlocks it with
`unlock-test <path>` once the fix passes. Locks live in the Git directory and are never committed.

The delivery ground truth belongs in `.agent-os/quality.json` as a `required` check, where the
quality-ratchet Stop hook enforces it after the developer has trusted the repository's controls.
