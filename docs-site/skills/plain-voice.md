---
title: plain-voice
description: Apply the full plain-voice checklist to written artifacts; the global policy covers ordinary replies.
skill-description: Plain wording for written artifacts such as documentation, README text, commit messages, pull request descriptions, issue comments, and release notes. Removes filler, restated requests, stacked hedges, and promotional wording so each sentence carries a fact, an instruction, or a number. Use when the user says things like write the PR description, draft the commit message, write the docs for this feature, or post a comment on the issue. Not for ordinary chat, explanations, summaries, or status replies, which the global policy covers, and not for code, identifiers, structured data, quoted source material, or text the user wrote.
summary: Apply plain voice to documentation, commits, and pull request text
---

# plain-voice

**Bucket:** discipline · **Invocation:** automatic

The core rules live in the global policy block, so they apply to every reply, including short chat
and status replies. A skill applies only when the model loads it, and the 2026-10-17 trigger eval
showed that the model does not load plain-voice for ordinary replies. This skill is the full
checklist for written artifacts: documentation, README text, commit messages, pull request
descriptions, issue comments, and release notes.

Keeps written output carrying facts rather than the appearance of effort. Every sentence should leave
the reader with a fact, an instruction, or a number.

Five recurring failures:

- **Claims with no source or mechanism.** Praise, promotional adjectives, attribution to unnamed
  experts.
- **Length without meaning.** Elevated synonyms, filler openers, stacked hedges, adverbs propping up
  a weak verb.
- **Abstract metaphor in place of a concrete noun.** Substrate, vector, surface, north star.
- **Structure imposed on the content.** Ideas forced into threes, "not just X but Y", bold labels
  that restate the line they introduce.
- **Conversational residue.** Congratulatory openers, closing offers of help, vague hedges about what
  might not hold. A claim that stays unverified after checking is stated once, plainly.

Two checks settle a doubtful sentence. Ask what it tells the reader to do or know; if it cannot be
restated as a fact, an instruction, or a number, cut it. Then ask whether it could appear unchanged
in another project's writing; if it could, it says nothing about this one.

Dashes do not belong in running text.

## Language scope

The five failures apply to any language. Spelling, punctuation, and vocabulary tells are English and
live in the skill's `references/tells.md`.

Established technical terms run the opposite way and stay in English whatever language surrounds
them. `edge case`, `pull request`, and `deploy` are what a developer says out loud, while `kantfall`
costs the reader a translation step before they can act on the sentence. Words with real native
usage, such as `databas` or `fil`, translate normally. When unsure, keep the English term.

## Boundary

Rewriting never reaches code, identifiers, structured data, quoted source material, or the
developer's own prose. Leave those unchanged unless the request is to edit them.
