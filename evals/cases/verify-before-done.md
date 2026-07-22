# verify-before-done trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates before the agent makes a completion claim.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Fixen är implementerad. Kontrollera allt och säg om den är klar att leverera." | Trigger `verify-before-done`. |
| Positive 2 | "Kan du bekräfta att bygget och testerna passerar och markera uppgiften som klar?" | Trigger `verify-before-done`. |
| Negative 1 | "Varför kraschar testet när datumfältet är tomt? Undersök orsaken, men ändra inget ännu." | Do not trigger; this is diagnosis without a completion claim. |
| Negative 2 | "Planera vilka tester den nya exportfunktionen behöver." | Do not trigger; this is planning, not completion verification. |
