---
title: What is agent-os?
description: The authority, workflow, discipline, and evidence model behind agent-os.
---

# What is agent-os?

agent-os is a small set of Agent Skills that gives coding agents shared working contracts across
Claude Code and Codex.

It answers three questions:

1. What outcome and boundaries govern this work?
2. What may the agent change under the developer's request?
3. What evidence decides whether the result is done?

## Two kinds of skill

**Workflows** are manually invoked. They structure guiding a vague desire to an approved goal, broad
decisions, bounded shaping, parallel batches, delivery, dispatch, durable lessons, and setup. They
do not activate merely because a request resembles them.

**Disciplines** activate from the situation: diagnose an unknown failure, contain scope drift,
verify a completion claim, and treat a developer correction as a misunderstanding signal.

## Authority follows the developer

A request to inspect, plan, or review is read-only apart from the requested artifact. A request to
implement authorizes in-scope repository changes. Merge, deploy, destructive cleanup, and effects on
external systems or people require the request or project policy to include them.

agent-os does not ask for a second permission already carried by the request. It asks when a material
product decision remains unresolved.

## Compact programs

Skills define objective, working surface, boundaries, ground truth, loop, and exit. They lock the
contract while leaving local tactics to the agent. Deterministic operations live in scripts and
tests rather than prose.

Everything remains plain Markdown in a Git repository and ships as one plugin for both platforms.

Next: [Getting started](/guide/getting-started).
