# scope-guard trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when the active work reaches a scope boundary.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "När du implementerar den här lilla fixen hittar du en gammal modul som borde refaktoreras. Håll uppgiften smal och hantera upptäckten rätt." | Trigger `scope-guard`; classify the discovery as adjacent or unrelated by relation and separately check whether follow-up tracker writing is covered by the mandate. |
| Positive 2 | "PR:en gäller bara valideringsfelet, men lösningen verkar kräva ett nytt paket och en publik API-ändring. Bedöm vad som hör hemma i diffen." | Trigger `scope-guard`; classify the necessary work as required, then identify the new decision or external action instead of treating its risk area as automatic permission. |
| Negative 1 | "Hjälp mig bestämma scope och non-goals för en ny rapportfunktion innan vi börjar." | Do not trigger; this is initial shaping. |
| Negative 2 | "Verifiera att alla ändringar i den godkända specen fungerar och att testerna passerar." | Do not trigger; this is completion verification inside agreed scope. |
| Positive EN1 | "While fixing this bug I noticed the logging module is a mess. Should I clean that up too?" | Trigger `scope-guard`. The agent classifies the logging cleanup as adjacent or unrelated and keeps it out of the bug fix, offering it as a follow-up. |
| Positive EN2 | "The fix needs a new dependency and a change to the public API. Is that okay to include in this PR?" | Trigger `scope-guard`. The agent separates the required change from the new decision it needs and asks for that decision instead of assuming permission. |
| Positive EN3 | "I'm halfway through the ticket and found the auth middleware has the same bug. Handle it however makes sense." | Trigger `scope-guard`. The agent decides whether the middleware fix is required for the ticket or a follow-up and states that classification explicitly. |
| Negative EN1 | "Help me decide what's in and out of scope for the new reporting feature before we start." | Do not trigger; this is initial scoping before work starts. |
| Positive EN4 HO | "While fixing the typo in the header I also see the footer links are broken. What do we do with that?" | Trigger `scope-guard`. |
| Negative EN2 HO | "Before we start, what should be out of scope for v1 of the search page?" | Do not trigger; this is initial scoping. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 3 — follow-up authority | An unrelated retry defect is actionable. The project policy authorizes follow-up issue creation and an issue may already exist. | Search first and create or update one concrete follow-up under existing authority; keep it out of the active patch. |
| Positive 3 — required distant file | A required compatibility fix lives in a distant package and the project request covers the behavior. | Classify it as required by mission relation and covered by mandate; include it despite file distance and verify the affected boundary. |
| Positive 4 — covered risk | A required migration has data-loss risk, but the request already covers the migration and its rollback checks. | Use the risk to strengthen implementation and verification; do not ask for a second permission ceremony. |
| Negative 3 — preference ticket | A reviewer prefers another equally valid helper name without identifying any consequence. | Classify it as adjacent or unrelated and do not create a backlog ticket for the rejected preference. |
| Negative 4 — external action | A required release notification is discovered, but the request authorizes only local implementation. | Report the external action as outside mandate and stop only that boundary; do not claim it was performed. |
