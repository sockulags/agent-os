# Choose structure before writing

Search the affected domain for an existing implementation, type, schema, and test fixture. Reuse
the owner of the behavior; matching fields or similar syntax alone do not establish shared meaning.
Keep domain helpers near their domain. Promote them to a shared library when the responsibility is
actually shared, not to fill a generic utils directory.

## TypeScript contracts

When Zod is the project's validation convention, keep the boundary schema authoritative and derive
types from it rather than separately maintaining the same interface in each consumer. Account for
different input and parsed output shapes when schemas transform values. Reuse or compose existing
schemas for the same contract; keep genuinely different domain, transport, and view contracts
distinct with explicit mappings. Do not centralize every type in one file or import server-only
validation dependencies into browser code just to share a type.

Validate untrusted data at real boundaries. Type assertions do not replace runtime validation, and
already validated internal values do not need repeated parsing at every function call. Do not
introduce Zod into a project with another established validation mechanism without justification.

## React responsibilities

Separate independently understandable UI regions, stateful behavior, and domain transformations
when they obscure the component's purpose. Prefer cohesive components and hooks with explicit
inputs over one component that owns unrelated behavior. Extract pure logic without turning it into
a hook. Preserve state ownership and server/client boundaries; avoid extraction that merely moves
the same complexity into prop plumbing. File length is a cue to inspect responsibilities, not a
limit or a reason to split JSX mechanically.

## Object and module design

Use objects to own state, invariants, and lifecycle when that matches the project; use functions
for stateless transformations. In Java, reuse existing domain types, services, and validation
conventions before adding DTOs, interfaces, or service layers. A single-use abstraction can still
name a cohesive responsibility or protect a boundary. Prefer composition to speculative inheritance
and do not impose a new object-oriented architecture on a focused change.
