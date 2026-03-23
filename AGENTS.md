# AGENTS.md

Conventions for working in this monorepo. Updated as the codebase
evolves; the rules below are the ones the workspaces have actually
converged on, not aspirational targets.

Scope: this document covers the apps under `apps/`. **Workspace-specific
rules live in subtree AGENTS.md files** -- read this one for repo-wide
context, then read the AGENTS.md closest to the files you're editing.
The closer file wins where the two overlap.

## Repository layout

```
apps/ui/          React Native / Expo client (TypeScript)
apps/fake-eidas/  Hono + Drizzle + Postgres stub of the eIDAS provider
api/              Rust API server                   (out of scope)
api-docs/         OpenAPI specs                     (out of scope)
migrations/       SQL migrations for the main DB    (out of scope)
```

Top-level config (`docker-compose.yaml`, `pnpm-workspace.yaml`,
`Cargo.toml`) and docs (`README.md`, `AGENTS.md`) live at the repo root.

## Where to find what

| Editing under...                | Read first                              |
| ------------------------------- | --------------------------------------- |
| `apps/ui/`                      | `apps/ui/AGENTS.md`                     |
| `apps/ui/components/`           | `apps/ui/components/AGENTS.md`          |
| `apps/ui/validation/`           | `apps/ui/validation/AGENTS.md`          |
| `apps/ui/views/ui-kit/`         | `apps/ui/views/ui-kit/AGENTS.md`        |
| `apps/fake-eidas/`              | `apps/fake-eidas/AGENTS.md`             |

Subtree files inherit from their parents -- the deepest AGENTS.md on the
path to the file you're editing has the final say, but the parents
still apply where the deeper file is silent.

## TypeScript style (baseline)

Applies to all apps unless overridden in a subtree AGENTS.md.

- Prefer `type` aliases for prop objects over `interface`.
- Spread defaults in destructuring
  (`{ variant = "simple", disabled = false }`) rather than
  `defaultProps`.
- Use `PropsWithChildren<Props>` when a component takes `children`.
- For preset records, declare the union and the record together; keep
  the union as the source of truth (`Record<FooSize, number>`).
- Use `as const` on literal arrays/objects that drive types
  (`AVATAR_SIZE_NAMES`).
- No path aliases in any workspace -- imports are relative.

Per-workspace specifics (import sort order, file-extension policy, etc.)
live in the workspace AGENTS.md.

## Documentation / JSDoc (philosophy)

JSDoc is **required in library layers** and **optional in glue code**.
Which files are which is workspace-specific -- see each workspace
AGENTS.md for the exact list. As of today the required surfaces are:

- `apps/ui/components/**`
- `apps/ui/validation/**`
- `apps/ui/views/ui-kit/{param-list,sections}.ts`
- `apps/fake-eidas/src/db/schema.ts` (one block per column)

Where JSDoc *is* required:

- The file starts with a block-level JSDoc explaining what's inside,
  when to reach for it, and any non-obvious trade-offs.
- Every exported symbol gets JSDoc: components, functions, types, **and
  every type property** (with `@defaultValue` for optional props).
- Reference related symbols with `{@link Foo}` / `{@link "./path"}`.
- For complex public APIs, include a worked example in fenced code
  blocks inside the JSDoc (see `apps/ui/validation/index.ts`).

Everywhere (required or optional):

- Inline comments are reserved for **intent, trade-offs, or constraints
  the code can't convey**. Avoid narrating comments ("Increment the
  counter", "Return the result"); if a line needs a comment to be
  understood, prefer renaming the symbol or extracting a function.

## Workflow

Run typecheck + tests in the workspace you actually touched. There is
no repo-wide "run everything" step today.

- `apps/ui` workflow -- see `apps/ui/AGENTS.md`.
- `apps/fake-eidas` workflow -- see `apps/fake-eidas/AGENTS.md`.

`apps/fake-eidas` ships Prettier (the only configured formatter in the
repo); `apps/ui` has no formatter and contributors match surrounding
style by hand. Don't introduce a new formatter without converting the
whole workspace in the same change.

## Anti-patterns (repo-wide)

- Don't add narrating code comments. Comment intent, not mechanics.

Workspace- and folder-specific anti-patterns live in the relevant
subtree AGENTS.md (kit naming, color palettes, validator empty-input,
variant duplication, etc.).
