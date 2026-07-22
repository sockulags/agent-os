# diagnose-before-fix trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates before any production-code patch.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Inloggningen började ge 500 efter senaste ändringen. Ta reda på varför och fixa grundorsaken." | Trigger `diagnose-before-fix`. |
| Positive 2 | "Det här testet faller bara ibland på CI. Reproducera felet och undersök orsaken innan du ändrar koden." | Trigger `diagnose-before-fix`. |
| Negative 1 | "Byt den felstavade miljövariabeln från API_URl till API_URL; orsaken är redan verifierad." | Do not trigger; this is a known-cause mechanical edit. |
| Negative 2 | "Kör testerna och visa om gårdagens redan implementerade fix fungerar." | Do not trigger; this is post-fix verification. |
