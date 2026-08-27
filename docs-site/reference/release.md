---
title: Release routine
description: Validate, version, publish, and verify an agent-os release.
---

# Release routine

1. **Validate structure and run the trigger evals.** Run
   `node scripts/validate-agent-os.mjs` and `node scripts/test-validate-agent-os.mjs`, then collect
   the live trigger and forward-test evidence described in [Evals](/reference/evals).
2. **Bump the version everywhere it lives.** The release version appears in five validated places:
   `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `package.json`, the navigation version in
   `docs-site/.vitepress/config.mjs`, and the manifest examples on the
   [plugin manifests](/reference/plugin-manifests) page. `validate-agent-os.mjs` fails the release
   until all five agree, so bump them in the same commit. Add the release to the
   [changelog](/changelog) while you are there.
3. **Commit, review, and merge.** Commit with the configured Git identity and no AI attribution,
   push an `agent/<description>` branch, require the repository checks on its exact head, and merge
   the pull request to `main`. Never release from a dirty worktree or an unmerged branch.
4. **Prepare the package.** Inspect `npm pack --dry-run --json`, then run
   `node scripts/smoke-packed-install.mjs`. The smoke test installs and updates the packed artifact
   in isolated Claude and Codex homes while proving that unrelated skills remain untouched.
5. **Publish through GitHub Actions.** Create the version tag on the merged release commit, then
   create a non-draft, non-prerelease GitHub Release and mark the newest stable version `Latest`.
   That explicit release action triggers `.github/workflows/publish.yml`. Its protected `npm`
   environment publishes `@sockulags/agent-os` through npm Trusted Publishing with short-lived OIDC
   credentials; do not store a long-lived npm publish token in GitHub.
6. **Close every public release surface.** The publish workflow reruns the repository and docs
   checks, publishes npm, and retries `node scripts/verify-release.mjs <version>` while the registry
   propagates. The verifier compares the tagged package with npm, checks GitHub and Pages, and
   performs a public isolated `npm exec` install with explicit package and command selection. The
   release is not complete until the workflow and the
   Validate and Docs/Pages runs on current `main` all pass. Smoke-test `--method plugin` separately
   when marketplace behavior changed.

The npm package settings must trust GitHub repository `sockulags/agent-os`, workflow `publish.yml`,
environment `npm`, and the `npm publish` action. The matching GitHub environment is the deployment
approval surface for npm publication.

## Documentation

This site lives in `docs-site/` and is built with [VitePress](https://vitepress.dev). Work on it
locally with:

```bash
npm --prefix docs-site install
```

```bash
npm --prefix docs-site run dev
```

A push to `main` that touches `docs-site/**` triggers the `Docs` workflow, which builds the site and
deploys it to GitHub Pages at `https://sockulags.github.io/agent-os/`. The base path in
`.vitepress/config.mjs` is `/agent-os/` and must match the repository name.

When the skills change, the pages under `/skills/` and `/reference/` are the mirror that goes stale
first. Treat a skill edit and its documentation page as one change.
