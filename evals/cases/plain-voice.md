# plain-voice trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when
the agent is about to author a written artifact: documentation, a commit message, a pull request
description, an issue comment, or release notes. Ordinary chat, explanation, summary, and status
replies are negative cases since the core rules moved into the global policy block on 2026-10-17.
Those cases were positive before that decision, under the names PV-P2, PV-P3, PV-P4, PV-P6, PV-P7,
and PV-P8.

| Case | Prompt | Expected |
|---|---|---|
| PV-P1 Generated draft | "Skriv beskrivningen till pull requesten som lägger till cache-lagret. Gör den läsbar för någon som inte följt arbetet." | Trigger `plain-voice`. The draft is prose for a human reader. |
| PV-N4 Swedish summary reply | "Sammanfatta på svenska vad som gick fel i deployen, vilket edge case vi missade och varför vår pull request behövde en rollback." | Do not trigger; a chat summary is covered by the global policy, which keeps technical terms in English inside the Swedish prose. |
| PV-N5 Ordinary reply | "Förklara varför testerna blev långsammare efter förra veckans ändring." | Do not trigger; an ordinary chat reply is covered by the global policy. |
| PV-N6 Short status reply | "Svara kort med status för verifieringen och vad som återstår." | Do not trigger; a short status reply is covered by the global policy. |
| PV-N1 Developer's own text | "Här är mina release notes. Stämmer versionsnumret med taggen vi la förra veckan?" | Do not trigger; this is a factual check on text the developer wrote. |
| PV-N2 Quoted source | "Plocka ut de exakta felmeddelandena ur den här loggen och lägg dem i issuen." | Do not trigger; quoted source material is copied, not rewritten. |
| PV-P5 EN PR description | "Write the PR description for the caching change." | Trigger `plain-voice`. The text has no filler opener, no restated request, and no stacked hedges; each sentence carries a fact or an instruction. |
| PV-N7 EN explain slowdown | "Explain why the build got slower last week." | Do not trigger; an explanation in chat is covered by the global policy. |
| PV-N8 EN status update | "Give me a quick status update on the migration." | Do not trigger; a status reply is covered by the global policy. |
| PV-N3 EN own commit message | "Here's my commit message, 'fix: handle empty cart'. Is it under 72 characters?" | Do not trigger; this is a factual check on text the developer wrote. |
| PV-N9 EN HO repo summary | "Summarize what this repo does in a few sentences." | Do not trigger; a chat summary is covered by the global policy. |
| PV-P9 EN commit message | "Draft the commit message for the fix to the login redirect loop." | Trigger `plain-voice`. The message states what changed and why, with no filler and no restated request. |
| PV-P10 EN docs page | "Write the docs page for the new --dry-run flag." | Trigger `plain-voice`. The page says what the flag does and when to use it, without promotional wording or filler openers. |

Pass criteria: the positive cases show the skill shaping a written artifact the agent authored. The
negative cases show the developer's own words and quoted material reaching the output unchanged, and
ordinary replies handled by the policy rules without loading the skill.
