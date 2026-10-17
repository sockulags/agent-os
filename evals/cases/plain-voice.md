# plain-voice trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when
the agent is about to author a textual response, including an ordinary chat or status reply.

| Case | Prompt | Expected |
|---|---|---|
| PV-P1 Generated draft | "Skriv beskrivningen till pull requesten som lägger till cache-lagret. Gör den läsbar för någon som inte följt arbetet." | Trigger `plain-voice`. The draft is prose for a human reader. |
| PV-P2 Swedish technical terms | "Sammanfatta på svenska vad som gick fel i deployen, vilket edge case vi missade och varför vår pull request behövde en rollback." | Trigger `plain-voice`. Technical terms stay in English inside the Swedish prose. |
| PV-P3 Ordinary reply | "Förklara varför testerna blev långsammare efter förra veckans ändring." | Trigger `plain-voice`. An ordinary chat reply is an agent-authored textual response covered by the discipline. |
| PV-P4 Short status reply | "Svara kort med status för verifieringen och vad som återstår." | Trigger `plain-voice`. A short status reply is still an agent-authored textual response. |
| PV-N1 Developer's own text | "Här är mina release notes. Stämmer versionsnumret med taggen vi la förra veckan?" | Do not trigger; this is a factual check on text the developer wrote. |
| PV-N2 Quoted source | "Plocka ut de exakta felmeddelandena ur den här loggen och lägg dem i issuen." | Do not trigger; quoted source material is copied, not rewritten. |
| PV-P5 EN PR description | "Write the PR description for the caching change." | Trigger `plain-voice`. The text has no filler opener, no restated request, and no stacked hedges; each sentence carries a fact or an instruction. |
| PV-P6 EN explain slowdown | "Explain why the build got slower last week." | Trigger `plain-voice`. The reply leads with the answer or with what is needed to find it, without filler or restating the question. |
| PV-P7 EN status update | "Give me a quick status update on the migration." | Trigger `plain-voice`. The status reply is short, factual, and free of filler, and it does not invent progress it cannot see. |
| PV-N3 EN own commit message | "Here's my commit message, 'fix: handle empty cart'. Is it under 72 characters?" | Do not trigger; this is a factual check on text the developer wrote. |
| PV-P8 EN HO repo summary | "Summarize what this repo does in a few sentences." | Trigger `plain-voice`. |

Pass criteria: the positive cases show the skill shaping prose the agent authored, and PV-P2 keeps
`edge case`, `pull request`, `deploy`, and `rollback` in English. The negative cases show the
developer's own words and quoted material reaching the output unchanged.
