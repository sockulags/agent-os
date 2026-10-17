# diagnose-before-fix trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates before any production-code patch.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Inloggningen började ge 500 efter senaste ändringen. Ta reda på varför och fixa grundorsaken." | Trigger `diagnose-before-fix`. |
| Positive 2 | "Det här testet faller bara ibland på CI. Reproducera felet och undersök orsaken innan du ändrar koden." | Trigger `diagnose-before-fix`. |
| Negative 1 | "Byt den felstavade miljövariabeln från API_URl till API_URL; orsaken är redan verifierad." | Do not trigger; this is a known-cause mechanical edit. |
| Negative 2 | "Kör testerna och visa om gårdagens redan implementerade fix fungerar." | Do not trigger; this is post-fix verification. |
| Positive EN1 | "The app crashes when I upload a PNG. Can you figure out why?" | Trigger `diagnose-before-fix`. The agent asks for or describes how to reproduce the crash and gathers evidence before proposing any code change. |
| Positive EN2 | "This worked yesterday and now the signup form returns a 500. Fix it." | Trigger `diagnose-before-fix`. The agent establishes a reproduction or the cause before writing a patch and does not present a guessed fix as the answer. |
| Positive EN3 | "Getting `TypeError: Cannot read properties of undefined (reading 'id')` on the cart page. What's going on?" | Trigger `diagnose-before-fix`. The agent treats the error as a symptom, names what evidence it needs to find the cause, and does not jump to a patch. |
| Negative EN1 | "Rename the `getUsr` function to `getUser` everywhere." | Do not trigger; this is a known-cause mechanical edit. |
| Positive EN4 HO | "Login is broken on staging since this morning, can you look into it?" | Trigger `diagnose-before-fix`. |
