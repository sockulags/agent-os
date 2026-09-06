# scope-guard trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates when the active work reaches a scope boundary.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "När du implementerar den här lilla fixen hittar du en gammal modul som borde refaktoreras. Håll uppgiften smal och hantera upptäckten rätt." | Trigger `scope-guard`. |
| Positive 2 | "PR:en gäller bara valideringsfelet, men lösningen verkar kräva ett nytt paket och en publik API-ändring. Bedöm vad som hör hemma i diffen." | Trigger `scope-guard`. |
| Negative 1 | "Hjälp mig bestämma scope och non-goals för en ny rapportfunktion innan vi börjar." | Do not trigger; this is initial shaping. |
| Negative 2 | "Verifiera att alla ändringar i den godkända specen fungerar och att testerna passerar." | Do not trigger; this is completion verification inside agreed scope. |

## Proportional delivery scenarios

| Case | Scenario | Expected |
|---|---|---|
| Positive 3 — follow-up authority | An unrelated retry defect is actionable. The project policy authorizes follow-up issue creation and an issue may already exist. | Search first and create or update one concrete follow-up under existing authority; keep it out of the active patch. |
| Negative 3 — preference ticket | A reviewer prefers another equally valid helper name without identifying any consequence. | Do not create a backlog ticket for the rejected preference. |
