---
title: plain-voice
description: Cut praise without a source, elevated synonyms, and conversational residue from prose a person will read.
skill-description: Removes generated-prose tells from text written for a human reader, so each sentence carries a fact, an instruction, or a number. It activates whenever the agent drafts or revises prose a person will read, including chat replies, documentation, commit and pull request text, and issue comments. It skips code, identifiers, structured data, quoted source material, and prose the developer wrote.
summary: Cut generated-prose tells from what a person reads
---

# plain-voice

**Bucket:** discipline · **Invocation:** automatic

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
- **Conversational residue.** Congratulatory openers, closing offers of help, disclaimers about what
  could not be checked.

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

Rewriting never reaches the developer's own words. Quoted source material stays as written, and prose
the developer authored is left alone unless the request is to edit it.
