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
3. **Commit and push**, using the Git identity configured by the repository or the current session,
   without AI attribution.
4. **Publish the npm CLI and update the plugin on both platforms.** Publish the package as
   `agent-os`, then verify `npx agent-os@latest update` can refresh the host plugin. On Codex this
   means refreshing and reinstalling — installation copies into the cache, so an old copy will keep
   serving the previous version — and then starting a new session.

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
