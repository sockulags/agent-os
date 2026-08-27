---
title: What is agent-os?
description: The authority, workflow, discipline, and evidence model behind agent-os.
---

# What is agent-os?

agent-os is a small set of reusable agent workflows built on the
[open Agent Skills specification](https://agentskills.io/specification). It currently gives Claude
Code and Codex the same working contracts from one shared source.

It answers three questions:

1. What outcome and boundaries govern this work?
2. What may the agent change under the developer's request?
3. What evidence decides whether the result is done?

<figure class="agent-os-diagram">
  <a href="/diagrams/agent-os-architecture.svg" target="_blank" rel="noopener" aria-label="Open the Agent OS architecture diagram at full size">
    <img class="diagram-light" src="/diagrams/agent-os-architecture.svg" alt="">
    <img class="diagram-dark" src="/diagrams/agent-os-architecture-dark.svg" alt="">
  </a>
  <figcaption>One managed operating layer supplies policy and skills to both hosts, then checks work against durable repository and evaluation evidence. Select the diagram to open it at full size.</figcaption>
</figure>

## Open standard, tested hosts

The portable core follows the Agent Skills directory model: a `SKILL.md` file with a name,
description, and instructions, plus optional scripts, references, and assets. Skills-compatible
agents can read that core format.

Agent OS currently promises tested behavior on two hosts:

- Claude Code uses `disable-model-invocation: true` to keep manual workflows opt-in.
- Codex uses `agents/openai.yaml` with `policy.allow_implicit_invocation: false` for the same rule.
- The npm installer and plugin manifests package those host-specific controls around the shared
  skill source.

Other skills-compatible agents may be able to load the core instructions, but they are not yet an
Agent OS support claim. Wider support requires a real installation and behavior test on that host,
not only compatible-looking files. See the current
[OpenAI skill metadata](https://developers.openai.com/codex/skills) and
[Claude Code skill controls](https://docs.claude.com/en/docs/claude-code/skills) for the host
extensions Agent OS uses.

## Two kinds of skill

**Most workflows** are manually invoked. They structure broad decisions, bounded shaping, parallel
batches, delivery, dispatch, durable lessons, and setup — with `guide-me` as an optional on-ramp
that guides a vague desire to an approved goal in front of them. The automatic `check-work`
workflow is the exception: it activates for supported code-review requests and can also be named
explicitly.

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

Everything remains plain Markdown in a Git repository and ships with adapters for both tested
hosts.

Next: [Getting started](/guide/getting-started).
