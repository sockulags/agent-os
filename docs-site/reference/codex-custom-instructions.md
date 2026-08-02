---
title: Codex custom instructions experiment
description: A smaller GPT-5.6 instruction prompt tested for evidence-driven, less speculative agent behavior.
---

# Codex custom instructions experiment

> Experimental: this is a local Codex model-catalog experiment, not installed Agent OS behavior.

The experiment replaced a 17,730-character shared GPT-5.6 instruction prompt with:

- a 4,889-character shared prompt for Sol, Terra, and Luna;
- a 1,541-character read-only prompt for Auto Review.

The design keeps request-derived authority, external/destructive boundaries, preservation of user
work, proportional verification, and fresh evidence before completion. It removes duplicate
warnings and reduces speculative edge-case analysis, unnecessary approval questions,
over-validation, and routine status narration.

The controlled smoke suite completed 31 runs across Sol, Terra, Luna, and Auto Review. The
candidate preserved the tested authority and review behavior. A first live desktop task after
installation produced two meaningful updates, identified two evidence-backed PR blockers, avoided
hypothetical risk lists, and stopped at a concrete next gate. That observation is anecdotal; the
full behavioral matrix remains open.

The complete experiment record includes:

- both exact prompts;
- the nine-operation JSON Patch contract;
- baseline and candidate measurements;
- installation hashes and startup proof;
- rollback instructions;
- limitations and the first live observation.

[Read the canonical experiment record on GitHub](https://github.com/sockulags/agent-os/blob/main/experimental/codex/custom_instructions.md).

OpenAI references used for the design:

- [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [Prompting](https://learn.chatgpt.com/docs/prompting)
- [AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Instruction hierarchy](https://openai.com/index/instruction-hierarchy-challenge/)
