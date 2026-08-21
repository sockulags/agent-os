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

Pass criteria: the positive cases show the skill shaping prose the agent authored, and PV-P2 keeps
`edge case`, `pull request`, `deploy`, and `rollback` in English. The negative cases show the
developer's own words and quoted material reaching the output unchanged.
