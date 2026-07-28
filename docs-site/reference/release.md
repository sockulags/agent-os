# Release routine

1. **Validate structure and run the trigger evals.** Run
   `node scripts/validate-agent-os.mjs` and `node scripts/test-validate-agent-os.mjs`, then collect
   the live trigger and forward-test evidence described in [Evals](/reference/evals).
2. **Bump `version` in both manifests** — `.claude-plugin/plugin.json` and
   `.codex-plugin/plugin.json`. They are the same version and are bumped together.
3. **Commit and push**, using the Git identity configured by the repository or the current session,
   without AI attribution.
4. **Update the plugin on both platforms and verify the new version loaded.** On Codex this means
   reinstalling or refreshing — installation copies into the cache, so an old copy will keep serving
   the previous version — and then starting a new session.

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
