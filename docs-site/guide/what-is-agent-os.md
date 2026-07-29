# What is agent-os?

agent-os is a personal agent operating system: a small set of Agent Skills that give a coding agent
a spine. It answers three questions that otherwise get re-improvised in every session — how work is
broken down, when the agent is allowed to change code, and what counts as proof that the work is
done.

It is a framework, not a product. Everything is plain Markdown in a Git repository, and it ships as
one plugin that installs into both [Claude Code](https://claude.com/claude-code) and Codex.

## Two kinds of skill

**Workflows** are invoked by hand. You type `/agent-os:deliver-work` in Claude Code or `$deliver-work`
in Codex, and the agent enters a sequence with explicit gates. They never activate on their own —
every workflow carries `disable-model-invocation: true` for Claude and an `agents/openai.yaml` with
`policy.allow_implicit_invocation: false` for Codex. Orchestration is opt-in on purpose: an agent
that starts charting a graph when you asked for a one-line fix has made your day worse.

**Disciplines** are the opposite. They carry no invocation switch and are written to trigger from the
situation itself: a failing test pulls in [`diagnose-before-fix`](/skills/diagnose-before-fix), an
about-to-be-made completion claim pulls in [`verify-before-done`](/skills/verify-before-done), and a
diff drifting past its authorized outcome pulls in [`scope-guard`](/skills/scope-guard). They are
short, always-available correctives rather than procedures you run.

## Ceremony proportional to the work

The four delivery workflows separate deciding, shaping, batching and implementing.

[`chart-work`](/skills/chart-work) is for an effort so broad you cannot yet state the questions
precisely. It produces a map and a graph of decision tickets that independent workers resolve in
parallel, each closing with a receipt: the decision, the evidence, the rejected alternatives, and
what the decision does to the route.

[`shape-work`](/skills/shape-work) is for a bounded change that still has open product questions. It
interviews you one decision at a time, always with a recommendation attached, and ends in a
decision-complete spec plus a visualization — a Mermaid flow for a backend change, a mockup built
from the repo's real design tokens for a frontend one.

[`batch-work`](/skills/batch-work) is for several decision-complete units that have stable
dependencies, scopes and acceptance. It freezes task hashes behind one checkpoint, dispatches
isolated `deliver-work` workers, reconciles receipts and commits serially, and verifies the complete
integrated candidate before delivery.

[`deliver-work`](/skills/deliver-work) is for work that is decision-ready. It walks readiness, plan,
checkpoint, implement, review, verify and deliver as seven separate step files, loading only the
current one so later steps cannot pull attention past the gate in front of them.

[`dispatch-next`](/skills/dispatch-next) sits beside all four. It reads a repository's live GitHub
state and picks exactly one decision-ready next action, then stops. It never does the work it
selects, and in its default shadow mode it never mutates anything at all.

## What it assumes about you

agent-os assumes you want to stay in the loop at the points where a human decision actually matters,
and stay out of it everywhere else. That shape shows up everywhere: `init-agent-os` shows a diff and
waits before writing a single file, `shape-work` refuses to leave a product question hidden inside an
implementation guess, and `deliver-work` treats "build it" as a task intent rather than as approval
of a plan.

It also assumes the repository is the source of truth. Every workflow reads the project policy first,
and none of them hardcode labels, branch names or merge rules — those live in the repo that owns
them.

Next: [Getting started](/guide/getting-started).
