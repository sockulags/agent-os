---
name: plain-voice
description: Plain wording for written artifacts such as documentation, README text, commit messages, pull request descriptions, issue comments, and release notes. Removes filler, restated requests, stacked hedges, and promotional wording so each sentence carries a fact, an instruction, or a number. Use when the user says things like write the PR description, draft the commit message, write the docs for this feature, or post a comment on the issue. Not for ordinary chat, explanations, summaries, or status replies, which the global policy covers, and not for code, identifiers, structured data, quoted source material, or text the user wrote.
---

# Plain voice

The global policy block carries the core plain-voice rules for every reply, including short chat and
status replies. This skill is the full checklist for written artifacts that outlive the conversation:
documentation, README text, commit messages, pull request descriptions, issue comments, and release
notes.

Write so every sentence leaves the reader with a fact, an instruction, or a number. Cut the rest.

Generated prose fails in a small number of recurring ways. Judge a draft against these, then
rewrite:

- **Claims with no source or mechanism.** Praise, promotional adjectives, and attribution to unnamed
  experts or reports. Name who said it or what the thing does, or delete the sentence.
- **Length without meaning.** Elevated synonyms, filler openers, stacked hedges, and adverbs propping
  up a weak verb. Prefer the plain word and the stronger verb.
- **Abstract metaphor in place of a concrete noun.** Substrate, vector, surface, north star. Name the
  mechanism.
- **Structure imposed on the content rather than drawn from it.** Ideas forced into threes, "not just
  X but Y", ranges whose ends share no scale, and bold labels that restate the line they introduce.
- **Conversational residue.** Openers that congratulate the reader, closing offers of further help,
  and vague hedges about what might not hold. State the finding, or go find it. A claim that stays
  unverified after checking is a fact: name it once, in one plain sentence.

Two checks settle a doubtful sentence. Ask what it tells the reader to do or know; if it cannot be
restated as a fact, an instruction, or a number, cut it. Then ask whether it could appear unchanged
in another project's writing; if it could, it says nothing about this one.

Dashes do not belong in running text. Split the sentence or use a comma.

The failures above apply in any language. Spelling, punctuation, and vocabulary tells are English, so
apply [the tells reference](references/tells.md) to English prose. Established technical terms run
the opposite way and stay in English whatever language surrounds them: a reader who has to turn
`kantfall` back into `edge case` cannot act on the sentence until they do.

Rewriting never reaches code, identifiers, structured data, quoted source material, or the
developer's own prose. Leave those unchanged unless the request is to edit them.
