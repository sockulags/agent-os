---
layout: home
title: agent-os
description: Compact workflows and automatic disciplines for coding agents on Claude Code and Codex.

hero:
  name: agent-os
  text: Explicit workflows, automatic disciplines
  tagline: A lightweight operating system for coding agents. One skill source, two platforms — Claude Code and Codex. Ceremony proportional to the work, evidence before every completion claim.
  image:
    src: /logo.svg
    alt: agent-os
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: What is agent-os?
      link: /guide/what-is-agent-os
    - theme: alt
      text: GitHub
      link: https://github.com/sockulags/agent-os

features:
  - icon: 🧭
    title: Chart, shape, batch, deliver
    details: A foggy effort becomes decision tickets, a bounded branch becomes implementation-ready issues, and the developer chooses individual delivery or an explicit integrated batch. When you cannot state the goal yet, guide-me questions it out first.
  - icon: 🧾
    title: Evidence before claims
    details: The verify-before-done discipline turns "it works" into a command, an exit status and a result. A check that ran proves only what that check exercised — and unverified claims get named as unverified.
  - icon: 🚧
    title: Authority follows the request
    details: An implementation request authorizes in-scope repository work. The agent asks only for unresolved product decisions and stops delivery at the requested boundary.
  - icon: 🔍
    title: Control the contract
    details: Skills lock outcomes, boundaries and ground truth while leaving local tactics to the implementer. Material delivery gets independent review; a fully qualified small fix may skip it.
  - icon: 🤝
    title: Two platforms, one source
    details: Every skill ships once and loads in both Claude Code and Codex. Manual skills are opted into explicitly on both; automatic skills trigger themselves from the situation.
  - icon: 📐
    title: Policy you can edit
    details: A single policy.md is installed as a managed block in your global instruction files, and every repo grows its own living project policy through an interview instead of a template.
---

## What it looks like

The optional on-ramp in action — a vague desire becomes an approved plain-language goal, planning
takes over, and evidence lands before any completion claim:

```text
User:
/guide-me Reports feel useless for our big customers and I
don't know what to do about it.

Agent:
Is the pain seeing the data, or taking it with them?

User:
Taking it with them. They paste screenshots into slides today.

Agent:
Plain-language summary: "This work gives large customers a proper way
to take a filtered result with them. It will not change what they can
see, only what they can carry away." Approve, or challenge it?

User:
Approved.

Agent:
Continuing into chart-work with that summary as the TLDR of the map.

    ...later, after shaping and delivery...

Command: npm test -- report-export
Exit: 0
Result: API, authorization, and CSV encoding cases pass.

Delivered to the requested boundary: one verified pull request.
Merge stays with you.
```

Read the whole journey in [The work loop](/guide/the-work-loop).
