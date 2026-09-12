# scope-guard trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when the active work reaches a scope boundary.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "När du implementerar den här lilla fixen hittar du en gammal modul som borde refaktoreras. Håll uppgiften smal och hantera upptäckten rätt." | Trigger `scope-guard`; classify the discovery as adjacent or unrelated by relation and separately check whether follow-up tracker writing is covered by the mandate. |
| Positive 2 | "PR:en gäller bara valideringsfelet, men lösningen verkar kräva ett nytt paket och en publik API-ändring. Bedöm vad som hör hemma i diffen." | Trigger `scope-guard`; classify the necessary work as required, then identify the new decision or external action instead of treating its risk area as automatic permission. |
| Negative 1 | "Hjälp mig bestämma scope och non-goals för en ny rapportfunktion innan vi börjar." | Do not trigger; this is initial shaping. |
| Negative 2 | "Verifiera att alla ändringar i den godkända specen fungerar och att testerna passerar." | Do not trigger; this is completion verification inside agreed scope. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 3 — follow-up authority | An unrelated retry defect is actionable. The project policy authorizes follow-up issue creation and an issue may already exist. | Search first and create or update one concrete follow-up under existing authority; keep it out of the active patch. |
| Positive 3 — required distant file | A required compatibility fix lives in a distant package and the project request covers the behavior. | Classify it as required by mission relation and covered by mandate; include it despite file distance and verify the affected boundary. |
| Positive 4 — covered risk | A required migration has data-loss risk, but the request already covers the migration and its rollback checks. | Use the risk to strengthen implementation and verification; do not ask for a second permission ceremony. |
| Negative 3 — preference ticket | A reviewer prefers another equally valid helper name without identifying any consequence. | Classify it as adjacent or unrelated and do not create a backlog ticket for the rejected preference. |
| Negative 4 — external action | A required release notification is discovered, but the request authorizes only local implementation. | Report the external action as outside mandate and stop only that boundary; do not claim it was performed. |
