# Agent OS project policy

This file is the repository-specific policy for Agent OS. `CLAUDE.md` must remain identical so
Codex and Claude Code receive the same project rules. Root `policy.md` is the source distributed to
users as global policy; do not put repository-only release rules there.

## Delivery

- Work on an `agent/<description>` branch, open a pull request, require the repository checks on the
  exact head, and merge before release publication. Use the repository Git identity and no AI
  attribution.
- Treat a release as one transaction across source, manifests, changelog, documentation, npm,
  GitHub tag, GitHub Release, and deployed GitHub Pages. A partial publication is not a completed
  release.
- Never run `npm publish` from a dirty worktree or before the release commit is merged to `main`.
  The published package must be built from the commit targeted by its version tag.
- Create a GitHub tag and non-draft GitHub Release for every npm version. Keep the newest stable
  version marked `Latest`; when backfilling history, point each tag at the actual release commit.
- Publish npm through `.github/workflows/publish.yml` using the `npm` environment and npm Trusted
  Publishing with OIDC. Never store a long-lived npm publish token in GitHub.
- A release request authorizes the normal PR, merge, tag, GitHub Release, npm verification, and docs
  verification steps needed to complete that release. Publishing starts only from an explicit
  stable GitHub Release after the release commit is merged.

## Verification

- Repository checks: `node scripts/validate-agent-os.mjs`,
  `node scripts/test-validate-agent-os.mjs`, `npm test`,
  `node skills/batch-work/scripts/test-manifest-hash.mjs`,
  `npm --prefix docs-site run build`, and `git diff --check`.
- Before publishing, inspect `npm pack --dry-run --json` and install the packed artifact in isolated
  Claude and Codex homes without relying on a checkout or host CLI.
- After publishing and merging, run `node scripts/verify-release.mjs <version>`. Do not call the
  release complete until it confirms the tag, GitHub Release, npm package integrity and `latest`
  tag, successful Validate and Docs runs on current `main`, live documentation, and a public
  isolated `npx` install.
- Green CI alone does not prove a release: verify the public npm and HTTP surfaces directly.

## Documentation and versioning

- Keep `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `package.json`, the docs navigation,
  plugin-manifest examples, and the current changelog heading on the same stable version.
- Give every released version its own changelog heading. Never let one release's notes remain under
  another version.
- A skill edit and its documentation page are one change. Changes under `docs-site/**` must reach a
  successful Pages deployment on `main` before documentation is considered synchronized.

## Planning and scope

- Use GitHub issues and pull requests for durable planning and delivery history. Do not infer
  `batch-work` from issue count; batch execution remains an explicit developer choice.
- Keep changes narrow and preserve unrelated work. Release repair may backfill missing metadata, but
  must not rewrite historical commits or move existing correct tags.
