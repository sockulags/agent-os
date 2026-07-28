# Chart-work Prototype and Shape-work Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `chart-work` inspectable prototype links and a durable, explicit next step into `shape-work`.

**Architecture:** Keep closed decision tickets canonical and introduce an open shape-work handoff as
the continuation object. Put prototype mechanics in one dedicated chart-work reference, reuse the
existing frontend mockup contract by direct link, and mirror both contracts in public docs and
versioned behavior cases.

**Tech Stack:** Markdown Agent Skills, VitePress documentation, behavior-case evals, JSON plugin manifests

---

### Task 1: Capture the current contract failure

**Files:**
- Test: `evals/cases/chart-work.md`

- [ ] **Step 1: Run a fresh baseline forward test**

Give a fresh agent only the current `chart-work` skill, references, and this scenario:

```text
A prototype decision settles a bounded frontend branch. Resolve the decision and tell me exactly
what durable artifact is linked, what remains open, and what a new session should work on next.
```

- [ ] **Step 2: Verify the current contract fails**

Expected: the agent may close the decision and mention graduation, but the source material does not
require both a stable prototype artifact link and a separate open shape-work handoff with an
explicit next command.

### Task 2: Define prototype and graduation contracts

**Files:**
- Create: `skills/chart-work/references/prototypes.md`
- Modify: `skills/chart-work/SKILL.md`
- Modify: `skills/chart-work/references/elicitation.md`
- Modify: `skills/chart-work/references/map.md`

- [ ] **Step 1: Add the dedicated prototype reference**

Require the smallest useful comparison, a stable inspectable link or path, a run/verification
receipt, observed reaction, user judgment, and disposal/retention status. Direct frontend
prototypes to `../shape-work/references/mockups.md`.

- [ ] **Step 2: Make the reference load-bearing**

Link the prototype reference directly from `chart-work/SKILL.md` and require it whenever a ticket
uses or converts to the `prototype` evidence path.

- [ ] **Step 3: Define the handoff object**

Extend `references/map.md` so graduation creates exactly one open, idempotent handoff containing:

```text
## Shape-work handoff
## Goal
## Non-goals
## Map
## Source decisions
## Prototype artifacts
## Decisions already settled
## Questions left for shape-work
## Next action
Run shape-work on this handoff.
```

Require the map and resolution receipt to link that handoff before the source ticket closes.

- [ ] **Step 4: State the user-facing transition**

Require the final report to name the linked handoff and say to run `shape-work` on it, while
preserving the explicit checkpoint and never auto-starting shaping.

### Task 3: Mirror the public documentation

**Files:**
- Create: `docs-site/reference/prototypes.md`
- Modify: `docs-site/skills/chart-work.md`
- Modify: `docs-site/reference/maps-and-tickets.md`
- Modify: `docs-site/guide/the-work-loop.md`
- Modify: `docs-site/.vitepress/config.mjs`

- [ ] **Step 1: Publish the prototype contract**

Mirror the dedicated reference and link it from the chart-work skill page and reference sidebar.

- [ ] **Step 2: Publish the handoff lifecycle**

Document the separate open handoff, links back to canonical closed decisions, explicit next command,
and no automatic transition.

### Task 4: Strengthen behavior cases

**Files:**
- Modify: `evals/cases/chart-work.md`

- [ ] **Step 1: Strengthen CW-P6**

Require a stable artifact link/path, verification receipt, observed reaction, and user judgment.

- [ ] **Step 2: Strengthen CW-P8**

Require exactly one open handoff, map-to-handoff linkage, source receipts, remaining questions, and
the explicit `shape-work` next action before closing the source decision ticket.

- [ ] **Step 3: Add hard acceptance**

Require retry idempotency and a blind fresh `shape-work` continuation without conversation history.

### Task 5: Verify and release

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`

- [ ] **Step 1: Run the GREEN forward test**

Give a fresh agent the revised files and the same sealed scenario. Expected: it records the stable
prototype artifact, creates one open linked handoff before closure, and names the explicit next
`shape-work` action.

- [ ] **Step 2: Validate structure and docs**

Run:

```powershell
Get-ChildItem skills -Directory | ForEach-Object {
  Test-Path (Join-Path $_.FullName 'SKILL.md')
}
npm --prefix docs-site install
npm --prefix docs-site run build
```

Expected: every skill directory has `SKILL.md`; VitePress exits 0 with no broken links.

- [ ] **Step 3: Bump both manifests**

Change both plugin versions from `0.4.0` to `0.4.1`.

- [ ] **Step 4: Review and deliver**

Review the final diff, commit without AI attribution, push `main`, create and push tag `v0.4.1`, and
publish the corresponding GitHub release after verifying the remote commit and release state.
