# apps/fake-eidas AGENTS.md

Local mock eIDAS 2.0 provider: Hono + `hono/jsx`, Postgres via Drizzle.
Not React — `apps/ui/` rules do not apply.

Parent: `/AGENTS.md`. System overview: `README.md`.

## Layout

```
src/
├── index.tsx              Server entry (`eidas.localhost:3000`)
├── components/            Shared Layout + hono/css UI components
├── constants/             Shared data (e.g. countries)
├── routes/<name>/         One folder per route (index.tsx + handlers)
└── db/
    ├── schema.ts          Table defs (JSDoc required per column)
    ├── queries.ts         Reads
    ├── mutations.ts       Writes
    ├── procedure.ts       Multi-statement transactions
    ├── drizzle.ts         Client; `DATABASE_URL` from repo-root `.env`
    └── seed.ts
migrations/                Drizzle SQL + meta/ (committed)
```

## Conventions

- **JSX**: `FC` from `hono/jsx`; never import `react`.
- **Styles**: `hono/css` (`css`, `cx`, `keyframes`) colocated in `.tsx`
  components. `Layout.tsx` head: `<Style>{globalStyles}</Style>` (plain
  `:root` / `body` / `input` from `theme.ts` — not `:-hono-global`) plus
  `<Style />` for component rules. Pass `css`/`cx` promises to `class`; never
  `await` at module scope. Nest scoped rules as
  ``${parentClass} { ${childClass} { … } }``. Client scripts use `data-*`.
- **Routes**: export a `Hono` sub-app from `routes/<name>/index.tsx`;
  mount in `src/index.tsx` with `app.route("/", …)`.
- **DB**: `fake_eidas` pgSchema; reads/writes in `queries.ts` /
  `mutations.ts`; re-export via `db/index.ts` optional.
- **Imports**: `.ts` suffix (`nodenext`); no path aliases.
- **Format**: Prettier before commit (only workspace with a formatter).

## Scripts

```bash
pnpm --filter fake-eidas dev
pnpm --filter fake-eidas drizzle-kit generate
pnpm --filter fake-eidas seed
pnpm --filter fake-eidas test:run
pnpm --filter fake-eidas exec tsc --noEmit
pnpm --filter fake-eidas exec prettier --write <files>
```

## Done checklist

1. `tsc --noEmit` and `test:run` pass.
2. Prettier on touched files.
3. Schema change → `drizzle-kit generate` and commit `migrations/` + `meta/`.
