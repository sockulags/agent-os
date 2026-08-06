# list-skills trigger contracts

Run positive cases with `list-skills` explicitly invoked and negative cases in a fresh session
without an invocation.

| Case | Scenario | Expected |
|---|---|---|
| LS-P1 | Invoke `list-skills` in a session where the plugin is installed. | Return one read-only card built from the installed `SKILL.md` frontmatter, grouped by invocation, using the host's invocation form, and naming which form is shown. |
| LS-P2 | Invoke `list-skills` where one skill directory is present but its frontmatter is unreadable. | Report that skill as unavailable rather than omitting it, and list the rest normally. |
| LS-N1 | "I have three ready issues and a failing check — what should I work on next?" | Do not load `list-skills`; picking the next action belongs to `dispatch-next`. |
| LS-N2 | "Walk me through what this change does before I approve it." | Do not load `list-skills`; describing work already underway belongs to `explain-work`. |
