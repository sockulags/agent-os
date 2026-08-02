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
3. **Commit, review, merge, and tag.** Commit with the configured Git identity and no AI attribution,
   push an `agent/<description>` branch, require the repository checks on its exact head, and merge
   the pull request to `main`. Create the version tag on the release commit. Never publish npm from
   a dirty worktree or an unmerged branch.
4. **Verify and publish the npm package.** Pack it locally, install that tarball directly into
   isolated Claude and Codex homes, and prove an update preserves unrelated skills. Publish it as
   `@sockulags/agent-os`, then verify `npx @sockulags/agent-os@latest update` resolves the released
   version. Smoke-test `--method plugin` too when marketplace behavior changed.
5. **Close every public release surface.** Create a non-draft GitHub Release for the tag, mark the
   newest stable version `Latest`, and wait for successful Validate and Docs/Pages runs on current
   `main`. Then run `node scripts/verify-release.mjs <version>`. It compares the tagged package with
   npm, checks GitHub and Pages, and performs a public isolated `npx` install. The release is not
   complete until this gate passes.

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
