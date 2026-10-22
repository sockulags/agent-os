# REVIEW.md template

`check-work` reads `REVIEW.md` at the repository root in every mode, including `check-work ci` in
the `agent-review` workflow. Copy everything below the rule into `REVIEW.md` and replace the
placeholders with what is true for this repository. Delete a section that would only repeat a
default.

---

```markdown
# Review policy

Agent and human reviewers read this before reviewing a pull request.

## Focus

<The areas where a mistake costs the most here, such as authorization checks, migrations, money,
or public API compatibility, each with one sentence on why.>

## Severity

- **Blocking:** incorrect behavior, a missed acceptance example from the spec, a security or data
  loss risk, a broken public contract, or an edit to an accepted intent or spec.
- **Should fix:** a defect with limited impact, a missing regression test for changed behavior, or
  complexity the change does not need.
- **Minor:** naming, comments, or local readability. Report at most <three> minor findings per review.

## Out of scope for review

<What reviewers should not comment on, such as formatting enforced by tooling or generated files.>

## Approval

An agent review never replaces the human approval that branch protection requires.
```
