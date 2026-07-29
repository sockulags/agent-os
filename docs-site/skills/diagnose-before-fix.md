# diagnose-before-fix

**Bucket:** discipline · **Invocation:** automatic

Finds a supported cause for a reproducible technical failure before committing a production fix.

Use the narrowest reliable reproduction as ground truth. Reduce the failure, trace the nearest seam,
compare plausible causes, and run high-information checks. Tests, logs, and temporary instrumentation
inside the task scope are available working surfaces.

Once evidence supports a cause, implement the smallest fix and rerun the original failing path. When
the cause cannot be distinguished, report bounded uncertainty and the next useful check rather than
presenting a hypothesis as a diagnosis.
