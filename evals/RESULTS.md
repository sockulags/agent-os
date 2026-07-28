# Eval results

Compact acceptance evidence. One row per case run. Raw logs go to `evals/runs/` (gitignored).
Results from sessions with unknown Superpowers status are invalid as acceptance evidence.

## Environment notes

- **Claude side**: Superpowers is not installed at all (verified against `~/.claude.json` and the
  plugin cache 2026-07-18) — clean environment by default.
- **Blocker 2026-07-18**: live trigger evals on the Claude side require the standalone CLI to be
  logged in (`claude.exe` returned "Not logged in" in every headless run; `~/.claude/.credentials.json`
  holds only MCP tokens). One-time interactive `/login` in a terminal `claude` unblocks the suite;
  rerun via the eval runner after that.

| Date | Agent | Session | Superpowers | Case | Result | Note |
|---|---|---|---|---|---|---|
| 2026-07-18 | claude 2.1.209 | headless `--plugin-dir`, fresh | not installed | PLUGIN-VISIBILITY | PASS | Init event lists plugin `agent-os` loaded from `<repo-root>` and all 8 skills namespaced: `agent-os:init-agent-os`, `agent-os:shape-work`, `agent-os:deliver-work`, `agent-os:dispatch-next`, `agent-os:verify-before-done`, `agent-os:diagnose-before-fix`, `agent-os:scope-guard`, `agent-os:writing-skills`. Evidence: `evals/runs/W1.jsonl` (system init line). |
| 2026-07-18 | claude 2.1.209 | headless, fresh | not installed | W1–W5, VBD/DBF/SG ×4, MANUAL | BLOCKED | All 18 runs stopped at authentication ("Not logged in"), zero model turns executed — no trigger behavior observed, results neither pass nor fail. Rerun after CLI login. |
| 2026-07-22 | Codex fresh subagent | isolated fixture, raw feature prompt | not available in session catalog | DW-SEQ-P2 | PASS | “Implement this feature” produced an `awaiting-approval` work record, plan, test seams, and wireframe; source diff remained empty and the agent halted at the checkpoint. |
| 2026-07-22 | Codex fresh subagent | isolated fixture, raw ambiguous prompt | not available in session catalog | DW-SEQ-P1 | PASS | Repo facts were inspected; the agent asked one recommended Queue-mode decision and halted before planning or any file mutation. |
| 2026-07-28 | Codex fresh subagent | isolated read-only continuation, raw `in-review` artifact | not available in session catalog | DW-REVIEW-P3 | PASS | Completed fixer and re-review work was not repeated; the agent presented both supported out-of-scope findings in one create-all/subset/neither question, left the tracker untouched, and kept the work `in-review`. |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker persisted fixture, fresh chart-work | available; not invoked | CW-P6/CW-P8 | PASS | `DEC-7` retains the stable prototype link, verification receipt, observed reaction, and explicit judgment/rationale; the reused open handoff is linked before source closure. Evidence: [tool actions](runs/2026-07-28-cw-tracker/tool-actions.log), [agent report](runs/2026-07-28-cw-tracker/agent-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker persisted partial-state fixture, fresh chart-work retry | available; not invoked | CW-P8R | PASS | The existing matching `HANDOFF-3` was reused; missing source, artifact, map, and receipt links were added, verified before `DEC-7` closed, and exactly one matching handoff remained. Evidence: [tool actions](runs/2026-07-28-cw-tracker/tool-actions.log), [agent report](runs/2026-07-28-cw-tracker/agent-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 tracker persisted completed handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The session preserved the settled rail decision and asked only the recorded compact-width icon-only-versus-label question; it did not re-litigate the drawer. Evidence: [shape-work report](runs/2026-07-28-cw-tracker/shape-work-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local persisted fixture, fresh chart-work | available; not invoked | CW-P6/CW-P8/CW-P10 | PASS | Local files preserve the prototype evidence and tracker semantics at `planning/navigation-refresh/shape-work/primary-navigation.md`; the handoff remains open and the source closes only after link verification. Evidence: [tool actions](runs/2026-07-28-cw-local/tool-actions.log), [agent report](runs/2026-07-28-cw-local/agent-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local persisted partial-state fixture, fresh chart-work retry | available; not invoked | CW-P8R | PASS | The existing matching local handoff was reused; source and artifact links were added once, map and receipt links were verified before closure, and exactly one matching handoff remained. Evidence: [tool actions](runs/2026-07-28-cw-local/tool-actions.log), [agent report](runs/2026-07-28-cw-local/agent-report.md). |
| 2026-07-28 | Codex fresh subagent | v0.4.1 local persisted completed handoff, fresh blind shape-work | available; not invoked | CW-P8S | PASS | The session preserved the settled rail decision and asked only the recorded compact-width question; it did not re-litigate the drawer. Evidence: [shape-work report](runs/2026-07-28-cw-local/shape-work-report.md). |
