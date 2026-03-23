# apps/ui AGENTS.md

React Native / Expo client (TypeScript). This file covers everything
that doesn't sit inside a subtree with its own AGENTS.md: the overall
layout, the Typography consumer rule, `App.tsx` wiring, the `core/` and
non-kit `views/` layers, and the ui-specific TS/style/workflow rules.

Sub-rules (read these when working in the matching subtree):

- `components/AGENTS.md` -- authoring component primitives
- `validation/AGENTS.md` -- the validation library + tests
- `views/ui-kit/AGENTS.md` -- authoring UI Kit demo screens

Parent rules: `/AGENTS.md` (repo-wide baseline).

## Structure

```
apps/ui/
├── App.tsx                       Root navigator (see "App-level wiring")
├── index.ts                      Expo entry -- registerRootComponent(App)
├── app.json                      Expo manifest (don't hand-edit native bits)
├── assets/                       Bundled images + fonts (see "Expo housekeeping")
├── android/  ios/                Expo prebuild output (don't hand-edit)
├── components/                   Reusable kit primitives -- see components/AGENTS.md
├── core/                         App-internal feature wrappers, providers, hooks
│   ├── account/
│   ├── data-collection/
│   ├── fonts.tsx
│   └── global-loader.tsx
├── validation/                   Pure validation library -- see validation/AGENTS.md
├── views/                        Screen-level components
│   ├── <Screen>.tsx              Non-kit screens (see "views/" below)
│   └── ui-kit/                   UI Kit demo navigator -- see views/ui-kit/AGENTS.md
└── vitest.config.ts              Tests live under validation/, components/, and core/
```

## Expo housekeeping

- `app.json` is the Expo manifest (icons, splash, permissions).
- `android/` and `ios/` are `expo prebuild` output -- treat them as
  generated and don't hand-edit.
- `assets/fonts/` is loaded at runtime by `core/fonts.tsx`. Bundle a new
  font by dropping it in there and adding the `loadAsync` entry (web)
  or an `app.json` `fonts` entry (native).
- `index.ts` just calls `registerRootComponent(App)` -- don't put logic
  there.

## Typography (consumer rule)

The base text primitive is `components/Typography.tsx#Text` -- a themed
wrapper around RN's `Text` that applies the active foreground color.

- In `core/`, `views/`, and any other feature/app code, import `Text`
  from `../components/Typography` (or the right relative path). **Do
  not** import React Native's `Text`.
- The kit's own components (under `components/`) may import raw RN
  `Text` internally as a leaf-level concession -- see
  `components/AGENTS.md`.

Use the role helpers instead of inline text styles:

- `Lede` -- top-of-page intro paragraph (once per screen).
- `Eyebrow` -- small uppercase label above a section or list.
- `Description` -- muted body paragraph; the workhorse for prose blocks.
- `Strong` -- inline bold inside a `Description`.
- `Caption` -- small secondary line; pass `follow` to stack a second
  caption.
- `Label` -- bold inline tag at the start of a `Caption` (e.g. `API:`).
- `Code` -- inline monospace for code, prop names, snippets.

The `TypographyScreen` in `views/ui-kit/` is the canonical reference.

## `core/` (feature wrappers, providers, hooks)

`core/` is where app-internal features live -- the non-reusable side of
the client. The shape is small but consistent:

- A **feature folder** (`core/account/`, `core/data-collection/`) groups
  a feature's components, hooks, and any context. Each folder owns its
  internal layout; today they're flat (`LoggedIn.tsx`, `application.ts`).
- A **provider + hook** pair is the standard composition primitive:
  - The provider is a named export (`LoggedInProvider`,
    `GlobalLoadingProvider`, `FontsProvider`) mounted in `App.tsx`.
  - Consumers reach the state through a hook (`useIsLoggedIn`,
    `useIsGuest`, `useLogout`, `useGlobalLoader`) -- never by reading
    the context directly. The context object itself is module-private.
- A **single-file wrapper** (`core/fonts.tsx`, `core/global-loader.tsx`)
  is fine when a feature is just one provider and its hook(s).
- A **feature root component** (e.g. `DataCollection`) is the
  default-exported wrapper consumers mount around `children`. It can
  drive side-effect hooks (`useApplication`) without rendering its own
  UI.

Conventions:

- `core/` is feature/app code: follow the Typography rule above (import
  `Text` from `components/Typography`, not from `react-native`).
- JSDoc is welcome but not required in `core/`; the layer is glue.
- `core/*` files do not need a UI-Kit demo entry.
- `App.tsx` composes the providers; the order there is the runtime
  order (outermost first). Add new providers there, not inside
  individual screens.

## App-level wiring

`App.tsx` owns the root navigator (`createNativeStackNavigator`) and
the provider stack. New screens go on the root stack as named routes;
gate auth-only or guest-only routes with
`if: useIsLoggedIn` / `useIsGuest` exported from
`core/account/LoggedIn`. The route name is the URL-friendly form
(`auth/login`, not `AuthLogin`).

## `views/` (non-kit screens)

Screens outside `views/ui-kit/` are real product views.

- One screen per file: `views/Home.tsx`, future `views/<Screen>.tsx`.
- Default-exported (matches `App.tsx`'s
  `screens: { home: { screen: Home } }` shape).
- Compose using kit primitives: import `Page`, `Section`, `Cluster`,
  `Hero` from `components/...` and prose helpers from `Typography`.
- Data fetching, auth gating, and route params belong here -- not
  inside `components/`. Keep `components/` presentational and let
  `views/` coordinate state via `core/*` hooks.
- Register the route on the root stack in `App.tsx`.

## TypeScript style (ui-specific)

Adds to the repo-wide baseline in `/AGENTS.md`:

- Sort imports framework first (`react`, then `react-native` /
  `expo-*`), third-party next, local last.
- No file extension on local imports (`../components/Page`).

## Workflow

Before declaring a UI task done:

```bash
pnpm --filter ui exec tsc --noEmit
pnpm --filter ui test:run
```

Also confirm:

- No `ReadLints` errors on touched files.
- **UI Kit in sync:** every new or changed primitive under `components/`
  has a matching demo update in `views/ui-kit/` in the same change (see
  "Demo requirement" in `components/AGENTS.md` and the coverage map in
  `views/ui-kit/AGENTS.md`). New components need at least one `ExampleBlock`;
  component changes must update the screen that already demos them so
  `usage` snippets and live samples match the API.

`apps/ui` does not have a formatter configured; match the surrounding
style by hand. Don't introduce a new formatter without removing the
inconsistency across the whole workspace in the same change.

## Anti-patterns (ui-wide)

- Don't add a `Kit*` prefix to shared primitives -- `components/` uses
  generic, semantic names (`Hero`, `Cluster`, `Page`, `Section`). The
  only `Kit*`-shaped thing in the kit is `ExampleBlock`, and that lives
  under `views/ui-kit/components/` precisely because it isn't a general
  primitive.
- Don't reach for raw RN `Text` outside of `components/` -- see the
  Typography rule.
