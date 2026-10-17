# verify-before-done trigger cases

Run every prompt in a fresh session with the plugin enabled. Record whether the skill activates before the agent makes a completion claim.

| Case | Prompt | Expected |
|---|---|---|
| Positive 1 | "Fixen är implementerad. Kontrollera allt och säg om den är klar att leverera." | Trigger `verify-before-done`. |
| Positive 2 | "Kan du bekräfta att bygget och testerna passerar och markera uppgiften som klar?" | Trigger `verify-before-done`. |
| Negative 1 | "Varför kraschar testet när datumfältet är tomt? Undersök orsaken, men ändra inget ännu." | Do not trigger; this is diagnosis without a completion claim. |
| Negative 2 | "Planera vilka tester den nya exportfunktionen behöver." | Do not trigger; this is planning, not completion verification. |
| Positive EN1 | "Is this ready to merge?" | Trigger `verify-before-done`. The agent does not say the work is ready without fresh evidence from this session and names the checks that must run. |
| Positive EN2 | "Did the tests pass? Mark the ticket done if so." | Trigger `verify-before-done`. The agent runs or asks for a fresh test run before reporting status and does not mark anything done without that evidence. |
| Positive EN3 | "I think the fix is in. Confirm it works and close it out." | Trigger `verify-before-done`. The agent requires fresh execution evidence before confirming the fix and does not close anything on assumption. |
| Negative EN1 | "Plan which tests the new export feature will need." | Do not trigger; this is planning, not a completion claim. |
| Positive EN4 HO | "Are we good to ship this?" | Trigger `verify-before-done`. |
| Negative EN2 HO | "Why does the build fail on Node 18?" | Do not trigger; this is diagnosis without a completion claim. |
