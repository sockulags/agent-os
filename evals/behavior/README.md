# Agent behavior scorecard

This layer grades observed behavior rather than final prose. Agent OS owns the small JSON format and
the scorecard. Promptfoo and Inspect AI are optional runners around it.

## Run record

A harness receives one JSON object on stdin:

```json
{"schema":1,"case_id":"dispatch-one-safe-backend-task","prompt":"..."}
```

It must execute the agent in an isolated fixture and return one normalized run object on stdout.
The record separates:

- selected workflows and live actions;
- material claims and the evidence IDs that support them;
- escalations and whether the decision was reversible and material;
- fresh verification observations;
- required asynchronous jobs and their terminal status;
- observed state changes with source, before value, and after value;
- optional human or model judgments with a score, rationale, and grader identity.

[`suite.json`](suite.json) is the versioned baseline. A case declares expected authority, workflow,
action count, lanes, verification surface, threshold, and grader mix. Critical failures cannot be
averaged away. A missing subjective judgment makes the result incomplete rather than silently
passing it.

## Local scoring

```sh
node scripts/eval-agent-behavior.mjs --run evals/behavior/fixtures/pass.json
node scripts/test-eval-agent-behavior.mjs
```

The checked-in pass and fail records test the scorecard itself. They are not evidence that a live
agent passed the cases. Real run records belong under the gitignored `evals/runs/` directory.

The documented 2026-08-13 baseline uses three independent live repetitions of six contracts. Its
accepted-record manifest selects 18 passing records and retains three rejected calibration runs
that exposed an incorrectly compensable qualitative gate. See `evals/RESULTS.md` for the exact
claims and limitations.

## Promptfoo

Set `AGENT_OS_EVAL_HARNESS` to a command that follows the stdin/stdout contract, then run Promptfoo
from its adapter directory:

```sh
cd evals/runners/promptfoo
npx promptfoo eval -c promptfooconfig.cjs
```

The custom provider executes the harness. The JavaScript assertion delegates every score to the
Agent OS core and exposes each scorecard row as a Promptfoo component result. Promptfoo is useful
for cheap regression matrices, CI, and red-team variants; it does not redefine the case format.

## Inspect AI

Install Inspect AI in an external Python environment, set the same harness command, and run:

```sh
inspect eval evals/runners/inspect/agent_os_behavior.py
```

The custom solver executes the harness and the scorer delegates to the same Node scorecard. Replace
the harness command with an Inspect sandbox or agent scaffold when stronger tool and filesystem
isolation is needed. Inspect logs retain the normalized run and component explanations.

## Harness requirements

The harness, not the agent, owns observation. It should derive actions from tool events, state
changes from before/after reads, and async status from the runtime. Do not ask the evaluated agent to
self-report those fields and treat the answer as ground truth. Human or model graders should only
fill the declared `judgments` entries; deterministic observations remain authoritative.

The checked-in Codex CLI harness creates an isolated fixture and `CODEX_HOME`, observes JSONL tool
events plus before/after state, waits on the asynchronous no-op fixture, and uses a separate Codex
session for the qualitative judgment:

```sh
set AGENT_OS_EVAL_HARNESS=node evals/behavior/harnesses/codex-cli.mjs
set AGENT_OS_EVAL_OUTPUT_DIR=evals/runs/live-behavior
```

The harness requires Docker. It runs Codex with unrestricted tools only inside a disposable
container that mounts the single eval case directory. The host Codex auth file is mounted read-only
and is never copied into eval artifacts. Raw attempts use unique append-only directories.

Use `evals/behavior/harnesses/replay.mjs` with `AGENT_OS_EVAL_REPLAY_DIR` to score the exact same
captured runs in another runner without executing the evaluated agent again.

For repeated runs, build the replay manifest from the raw append-only records. The command fails
unless every case has the requested number of passing repetitions:

```sh
node scripts/summarize-agent-behavior-runs.mjs --runs evals/runs/<run-name> --repetitions 3
```

Set `AGENT_OS_EVAL_RECORD_MANIFEST` to the generated `accepted-records.json` when replaying all
accepted repetitions through Promptfoo or Inspect AI.
