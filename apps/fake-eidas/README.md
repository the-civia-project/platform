# fake-eidas

A **local-only mock of an eIDAS 2.0 identity provider**. It lets the Civia
client (`apps/ui`) and API exercise the “login with eIDAS” registration path
without connecting to a real government identity service.

This is not a security product, not spec-compliant, and not suitable for
production. It exists to make the dev loop fast and repeatable.

## Role in the platform

When a user taps **Login with eIDAS 2.0** in the app, the client opens this
service in a browser (or assigns `window.location` on web). The user picks an
existing identity or creates a new one. fake-eidas then redirects back to the
app with query parameters the client forwards to the Rust API.

```
apps/ui  →  fake-eidas (pick / create person)
         →  apps/ui auth/callback (?code=&country=)
         →  platform API POST /register (eidas_2_0_id + citizen_of)
```

| Piece | Responsibility |
| ----- | -------------- |
| **fake-eidas** | Pretends to be eIDAS: shows identities, issues a person `id` as `code` |
| **apps/ui** | Opens `http://eidas.localhost:3000?redirect=…`, handles the callback |
| **API** | Registers the user with `eidas_2_0_id` (UUID) and `citizen_of` (ISO numeric) |

The person `id` in Postgres is a UUID and becomes the `eidas_2_0_id` sent to
`/register`. `citizen_of` is stored as an ISO 3166-1 **numeric** country code
(e.g. `276` for Germany).

## What it does today

- **GET /** — Person picker. Requires a `redirect` query URL (where to send the
  user after login). Lists everyone in `fake_eidas.people` with name, country,
  and avatar. Clicking a person redirects to
  `{redirect}?code={uuid}&country={numericCode}`.
- **POST /new** — Creates a person from the form on the same page (name +
  random country), then redirects to `{redirect}?code={uuid}`.

Pages are server-rendered with [Hono](https://hono.dev/) and
[`hono/jsx`](https://hono.dev/docs/guides/jsx) (not React). [htmx](https://htmx.org/)
boosting is enabled on the layout for in-page navigation where supported.

## Prerequisites

- Node.js (see repo `.nvmrc`)
- pnpm (see root `package.json` `packageManager`)
- PostgreSQL — typically via repo `docker compose up -d pg`
- `DATABASE_URL` in the **repo-root** `.env` (loaded by `src/db/drizzle.ts`)
- Hostname **`eidas.localhost`** resolving to loopback (many systems treat
  `*.localhost` automatically; otherwise add `127.0.0.1 eidas.localhost` to
  `/etc/hosts`)

Apply migrations and seed sample people before first use:

```bash
# from repo root — exact migrate command depends on your DB workflow
pnpm --filter fake-eidas drizzle-kit migrate
pnpm --filter fake-eidas seed
```

## Running

From the monorepo root:

```bash
pnpm --filter fake-eidas dev
```

The server listens on **http://eidas.localhost:3000** (not plain `localhost`).

Manual smoke test:

```text
http://eidas.localhost:3000/?redirect=http://civia.localhost:8081/auth/callback
```

Replace the `redirect` value with whatever callback URL your client uses.

## Project layout

```
src/
├── index.tsx                 App entry, mounts routes, starts Node server
├── components/
│   ├── Layout.tsx            Shared HTML shell + `<Style />`
│   ├── theme.ts              Global CSS variables and resets
│   └── …                     PageHeader, PersonGrid, CountryPicker, etc.
├── constants/
│   └── countries.ts          ISO country list (i18n-iso-countries)
├── routes/
│   └── person-list/          Login / person-picker route handlers
│       └── index.tsx
└── db/
    ├── schema.ts             Drizzle schema (`fake_eidas.people`)
    ├── queries.ts / mutations.ts
    ├── seed.ts
    └── drizzle.ts            Postgres client + dotenv
migrations/                   Drizzle SQL (committed)
```

## Scripts

```bash
pnpm --filter fake-eidas dev                   # tsx watch
pnpm --filter fake-eidas drizzle-kit generate  # new migration from schema
pnpm --filter fake-eidas seed                  # seed sample people
pnpm --filter fake-eidas test:run              # vitest
pnpm --filter fake-eidas exec tsc --noEmit     # typecheck
```

Contributor conventions: `AGENTS.md` in this directory.
