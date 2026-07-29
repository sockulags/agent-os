# scope-guard

**Bucket:** discipline · **Invocation:** automatic

Keeps an active change aligned with the developer's requested outcome.

Classify discoveries:

- **Required:** needed for the outcome or its verification; include it.
- **Adjacent:** useful but unnecessary now; leave it out.
- **Conflicting:** changes product behavior, architecture, dependencies, a public interface, or
  delivery risk; ask before crossing the boundary.

Inspect the final diff for unrelated edits and preserve pre-existing developer work.
