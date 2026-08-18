"""Inspect AI adapter for the runner-independent agent-os behavior scorecard."""

import asyncio
import json
import os
import subprocess
import tempfile
from pathlib import Path

from inspect_ai import Task, task
from inspect_ai.dataset import Sample
from inspect_ai.model import ModelOutput
from inspect_ai.scorer import Score, Target, mean, scorer
from inspect_ai.solver import Generate, Solver, TaskState, solver

ROOT = Path(__file__).resolve().parents[3]
SUITE_PATH = ROOT / "evals" / "behavior" / "suite.json"
SCORECARD = ROOT / "scripts" / "eval-agent-behavior.mjs"


def _suite() -> dict:
    return json.loads(SUITE_PATH.read_text(encoding="utf-8"))


def _samples() -> list[Sample]:
    suite = _suite()
    by_id = {item["id"]: item for item in suite["cases"]}
    manifest = os.environ.get("AGENT_OS_EVAL_RECORD_MANIFEST")
    if manifest:
        records = json.loads(Path(manifest).read_text(encoding="utf-8"))["accepted"]
        return [
            Sample(
                id=record["run_id"],
                input=by_id[record["case_id"]]["prompt"],
                target=record["case_id"],
                metadata={"case_id": record["case_id"], "record_file": record["file"]},
            )
            for record in records
        ]
    return [
        Sample(id=item["id"], input=item["prompt"], target=item["id"], metadata={"case_id": item["id"]})
        for item in suite["cases"]
    ]


def _run_harness(payload: str) -> str:
    command = os.environ.get("AGENT_OS_EVAL_HARNESS")
    if not command:
        raise RuntimeError("AGENT_OS_EVAL_HARNESS must emit one normalized run JSON object to stdout.")
    completed = subprocess.run(
        command,
        input=payload,
        text=True,
        encoding="utf-8",
        capture_output=True,
        shell=True,
        check=True,
    )
    json.loads(completed.stdout)
    return completed.stdout.strip()


@solver
def agent_os_harness() -> Solver:
    async def solve(state: TaskState, generate: Generate) -> TaskState:
        payload = json.dumps({
            "schema": 1,
            "case_id": state.metadata["case_id"],
            "prompt": state.input_text,
            **({"record_file": state.metadata["record_file"]} if "record_file" in state.metadata else {}),
        })
        output = await asyncio.to_thread(_run_harness, payload)
        state.output = ModelOutput.from_content("agent-os-harness", output)
        return state

    return solve


@scorer(metrics=[mean()])
def agent_os_scorecard():
    async def score(state: TaskState, target: Target) -> Score:
        run = json.loads(state.output.completion)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False) as handle:
            json.dump(run, handle)
            run_path = handle.name
        try:
            completed = await asyncio.to_thread(
                subprocess.run,
                ["node", str(SCORECARD), "--suite", str(SUITE_PATH), "--run", run_path, "--json"],
                capture_output=True,
                text=True,
                encoding="utf-8",
            )
            if completed.returncode not in (0, 1):
                raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
            card = json.loads(completed.stdout)
            return Score(
                value=card["score"],
                answer=json.dumps(card),
                explanation="; ".join(
                    f'{item["id"]}: {item["reason"]}' for item in card["components"] if not item["pass"]
                ) or "All scorecard components passed.",
                metadata={"pass": card["pass"], "critical_failure": card["critical_failure"]},
            )
        finally:
            Path(run_path).unlink(missing_ok=True)

    return score


@task
def agent_os_behavior() -> Task:
    return Task(dataset=_samples(), solver=agent_os_harness(), scorer=agent_os_scorecard())
