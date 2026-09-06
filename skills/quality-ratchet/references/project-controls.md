# Project controls

Use the installed `quality-ratchet/scripts/quality-delta.mjs` runner for `begin`, `check`, and
`hook`. Project controls are optional. They use existing executable tools; Agent OS neither installs
analyzers nor infers architecture from file size. The same commands work manually and in CI.

## Configuration

Create `.agent-os/quality.json` in the target Git repository. Example for a TypeScript project that
already has dependency-cruiser installed (verify its executable path in your installed version):

```json
{
  "schema": 1,
  "protectedFiles": [".dependency-cruiser.cjs"],
  "checks": [
    {
      "id": "architecture",
      "command": ["node", "node_modules/dependency-cruiser/bin/dependency-cruise.mjs", "--config", ".dependency-cruiser.cjs", "src/**/*.ts"],
      "required": true,
      "timeoutMs": 60000
    }
  ],
  "blockSignals": []
}
```

The project's dependency-cruiser configuration owns its architecture, for example:

```js
module.exports = {
  forbidden: [{
    name: 'domain-does-not-import-ui',
    severity: 'error',
    from: { path: '^src/domain/' },
    to: { path: '^src/ui/' }
  }],
  options: { doNotFollow: { path: 'node_modules' } }
}
```

For Java, keep architecture rules in the project's existing ArchUnit tests and run the project's
Maven/Gradle verification command. For example, a Maven project with a configured `ArchitectureTest`
can use `"command": ["./mvnw", "-Dtest=ArchitectureTest", "test"]`. Protect the rule test and build
configuration through `protectedFiles`. Do not introduce a second homegrown dependency parser.
Use the actual project wrapper and supported command for its operating system.

Commands are argument arrays, run at the Git root with inherited environment and no implicit shell.
Use an explicit interpreter for scripts that need one; on Windows prefer Node entrypoints or the
project's explicitly selected shell for `.cmd` wrappers. The repository configuration is trusted
executable project code. Inspect it before running it, as with project build scripts.

All checks default to advisory and run on every `check`. `required: true` blocks delivery unless the
command exits zero. Missing tools, timeout, signal termination, and output overflow are distinct
non-passing results. The timeout defaults to 60 seconds, at most 600 seconds per command. Commands
must be bounded and clean up their child processes; the runner does not manage process groups.
Output is capped at 1 MiB while running and 16,000 characters in evidence. No command runs in Stop.

Required checks apply to the candidate, including existing violations. Introduce rules as advisory
when existing debt prevents passing; use the analyzer's own approved baseline support if needed.
Agent OS does not suppress pre-existing analyzer failures or equate tool success with sound design.

## New exceptions and policy changes

The runner reports new source lines matching `type-escape` (common `: any`/`as any` annotations and casts, TypeScript suppression comments),
`lint-disable` (ESLint suppression and Java `@SuppressWarnings`), and `test-skip` (common test skips,
focused tests, and Java `@Disabled`). It subtracts existing occurrences per file, ignoring simple
line movement. These lexical signals can match comments or strings and can reappear on rename;
they do not establish a semantic defect. Review them or delegate exact rules to the project's linter.
Only rules explicitly listed in `blockSignals` block delivery. Raw LOC and structural counts never do.

The policy itself and repository-relative `protectedFiles` are fingerprinted at entry. Include the
lint, type, test, architecture, and CI configurations whose weakening should require attention.
A protected missing file is represented as absent; later creation or deletion changes the signature.
Changes are held before project commands run until restored or explicitly acknowledged:

```sh
node "$QUALITY_RUNNER" check --accept-policy-change "Task authorizes replacing the obsolete architecture rule"
```

Reuse existing task authorization; ask only if the change exceeds it. The reason remains in evidence.
`clear` cannot silently erase an unacknowledged policy change. Acknowledgement does not turn a failed
check into a pass. Local configuration and Git metadata remain editable by the user and agent;
this is transparent workflow control, not an authorization boundary. Enforce protected rules in CI.

## Conservative reuse

No cache is enabled by default. Only an explicitly static check can opt in:

```json
"cache": { "kind": "static", "toolInputs": ["node_modules"] }
```

Declare every ignored file/directory that can affect the static tool, including its installed
transitive dependencies and compiler plugins. This requires regular files/directories inside the
repository; symlinked inputs and repositories with symlinks/submodules cannot use static caching.
`.git`, absolute paths, and traversal are disallowed. Missing declared inputs are unavailable, not
clean. Use uncached checks when tool installations cannot be described this way.

The key covers the whole tracked and nonignored repository, declared tool inputs and modes, the
resolved executable bytes, command, policy and protected files, runner code, Node runtime, OS and
architecture, and a digest of the complete inherited environment. Environment values are not stored.
Full repository scope deliberately avoids unsafe guesses about affected tests. Only a passed result
from this session's previous check can be reused. Failures and dynamic checks always run again.

Do not opt integration/E2E tests, network-dependent checks, clocks, external services, or mutable
external caches into static reuse. Their state is not captured by this key. Source hashes alone
cannot justify reuse. An incorrect tool-input declaration can invalidate the caching assumption.

Stop hashes inputs again but does not spawn analyzers. Hashing a large ignored tool directory can be
expensive and the native hook has a ten-second timeout. Measure before enabling it; use smaller
complete tool inputs or leave caching off. No latency or token-saving target is claimed.

## Evidence and CI

```sh
node "$QUALITY_RUNNER" begin
# implementation, or the candidate checks in CI
node "$QUALITY_RUNNER" check --json
```

`check` exits 1 on blocked evidence, 0 when all required checks pass, and reports errors as nonzero.
The default output is concise; `--json` includes per-check status, command, fingerprint, cache reuse,
measured scope, duration, output, signals, and any policy acknowledgement. The latest full report is
`<session-state-path>.report.json` under Git metadata and survives successful Stop; `begin` prints the
session state path. Treat command output as potentially sensitive when uploading reports.

For CI, use a fresh checkout and the same runner and project policy; `check` is the gate. A baseline
started on the candidate detects full command failures but cannot detect exceptions introduced by
that candidate. To compare new exception lines or protected policies, `begin` on the trusted base
and then check out the candidate in the same worktree and host session before `check`. Keep the
runner and protected CI policy trusted outside candidate-controlled scripts when enforcing security.

A green result only establishes the configured checks at the recorded inputs. It does not select a
useful prototype, judge abstraction quality, prove meaningful test coverage, or replace review.
