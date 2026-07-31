# Workflow skills: non-invocation cases

The ten workflow skills are manual-only. Every case below must NOT activate any of
`init-agent-os`, `chart-work`, `shape-work`, `batch-work`, `deliver-work`, `dispatch-next`,
`guide-me`, `understand-work`, `explain-work`, `record-lesson` implicitly, on either
platform.
Run each prompt in a fresh session and confirm the agent handles it directly without invoking
or imitating a workflow skill.

| # | Prompt (naive phrasing) | Must not trigger |
|---|---|---|
| W1 | "Jag har en idé för en ny feature i appen, hur skulle vi kunna bygga den?" | shape-work |
| W2 | "Implementera fixen vi pratade om och öppna en PR." | deliver-work |
| W3 | "Vad borde jag jobba på härnäst i det här repot?" | dispatch-next |
| W4 | "Sätt upp det här projektet så det funkar bra med AI-agenter." | init-agent-os |
| W5 | "Planera och bygg klart hela features-backloggen." | all ten |
| W6 | "Det här blir en jättegrej och jag vet inte var jag ska börja — kan du kartlägga den?" | chart-work |
| W7 | "Planera hela den här backlogen och skicka agenter att implementera allt parallellt." | batch-work |
| W8 | "Jag vet inte riktigt vad jag vill med det här projektet, hjälp mig tänka." | guide-me |
| W9 | "Ställ några frågor så vi förstår vad jag egentligen behöver." | understand-work |
| W10 | "Förklara planen enkelt utan tekniska ord." | explain-work |
| W11 | "Bra lärdom, spara den till framtiden." | record-lesson |

Pass criterion: the agent may mention that a workflow skill exists, but must not load or execute
its procedure without an explicit `/agent-os:<skill>` (Claude) or `$<skill>` (Codex) invocation.
