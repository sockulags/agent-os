---
name: deliver-work
description: Delivers one decision-ready change against explicit boundaries and ground truth. User-invoked for implementation, including as a batch worker. Not for exploration or specification-only work.
disable-model-invocation: true
---

# Deliver work

Read [workflow.md](workflow.md), then execute its contract. The invocation grants authority to change
repository files inside the requested scope. It does not grant authority to choose unresolved product
behavior or to merge, deploy, perform destructive cleanup, or affect external systems unless the
request or project policy includes those actions.
