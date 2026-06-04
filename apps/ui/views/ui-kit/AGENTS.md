# apps/ui/views/ui-kit AGENTS.md

The UI Kit feature lives here: an inner stack navigator wired in
`UiKit.tsx` plus one demo screen per component or family. Every
component in `apps/ui/components/` must be reachable from a screen in
this folder.

**Contract with `components/`:** adding or changing a kit primitive and
updating its demo are one task. When you create a component, add or extend
a demo here before the work is done. When you change a component, find its
screen in the coverage map below and update the matching `ExampleBlock` rows
(`summary`, `description`, `usage`, `samples`) so the kit still matches the
API. New families need catalog wiring (`param-list.ts`, `sections.ts`,
`UiKit.tsx`) unless they share an existing screen.

Parent rules: `apps/ui/AGENTS.md` and `/AGENTS.md`.

## Folder shape

```
views/ui-kit/
├── UiKit.tsx                Inner stack navigator
├── param-list.ts            Stack param map (typed) -- one entry per route
├── sections.ts              Home-grid catalog + category metadata
├── random-posts.ts          Shared random-post generator (used by FeedScreen
│                            today; reach for it from any new demo that
│                            wants a stream of fabricated FeedItems instead
│                            of duplicating the cast + media pools)
├── HomeScreen.tsx           The hero panel + grid of kit cards
├── <Component>Screen.tsx    One screen per component or family
└── components/              UI-Kit-internal components (e.g. ExampleBlock)
                             -- not general primitives, not for apps/ui/components/
```

Related components share a screen when natural (see `CardsScreen` for
`Card + DisclosureCard`, `LayoutScreen` for the layout wrappers).

## Screen anatomy

```tsx
/**
 * UI Kit screen for `components/Foo.tsx`. Each block documents one variant.
 */
import { useMemo } from "react";
import { ExampleBlock, type ExampleBlockProps } from "./components/ExampleBlock";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import { Caption, Code, Description, Label, Lede } from "../../components/Typography";

type FooRow = ExampleBlockProps & { key: string };

export default function FooScreen() {
  const rows: FooRow[] = useMemo(() => [
    {
      key: "variant-a",
      name: "variant-a",
      summary: <Description>Headline answer to "what is this block about?"</Description>,
      // Optional -- omit when the summary is the whole explanation.
      description: <Description>Implementation detail and edge cases…</Description>,
      usage: (
        <Caption>
          <Label>API: </Label>
          <Code>{`<Foo variant="a" />`}</Code>
        </Caption>
      ),
      samples: <Foo variant="a">Sample</Foo>,
    },
    // ...
  ], []);

  return (
    <Page>
      <Lede>One-paragraph intro to the whole component.</Lede>
      <Section title="Variants">
        {rows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === rows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}
```

Rules:

- Wrap the screen in `Page` (scrolling shell with kit-standard padding).
  **Exception:** primitives that own their own vertical scroll container
  (today: `Feed`, `UserProfile`) mount as the screen's root and push the
  kit-style prose intro into the primitive's header slot. Nesting two
  vertical scrollers produces ambiguous gesture handling on iOS / Android
  even though web appears to work, so the page wrapper is dropped on
  those screens. See `FeedScreen.tsx` for the canonical layout with kit
  prose in the header, and `UserProfileScreen.tsx` for the variant that
  defers the header entirely to the primitive (the user-profile owns
  its X-style banner + identity + bio + meta + stats + sticky tabs
  header) and lets the screen file stay a thin data-generation wrapper.
  The user-profile screen runs the kit in uncontrolled mode (the
  primitive owns the active-tab state); the controlled `activeTabId`
  contract is exercised by `components/UserProfile/resolve-active-tab.test.ts`
  rather than an on-screen affordance.
- Open with a single `Lede` describing the whole component.
- Bucket entries into `Section`s; one section per logical grouping.
- Each entry is an `ExampleBlock` with `name`, `summary`, `usage`,
  `samples`. `description` is **optional** -- pass it when the prose has
  more to say than a sentence; the `ExampleBlock` then tucks it behind an
  `Accordion` "Show more" toggle. Short entries are summary-only and read
  as a one-line description.
- The `summary` is the headline answer ("what is this block about?"); the
  `description` is the rest (implementation detail, edge cases, related
  primitives). Aim for a single sentence in `summary` so the collapsed
  screen reads as a scannable catalogue.
- **`usage` snippets do not include `import` statements** -- show the
  JSX call only.
- Compute rows with `useMemo`; type them as
  `ExampleBlockProps & { key: string }`.
- Set `isLast` on the final block of each section to drop the trailing
  divider.
- The kit-internal `ExampleBlock` lives at `./components/ExampleBlock.tsx`
  -- it is not a general primitive and does not belong in
  `apps/ui/components/`.

## Wiring a new screen

Three files to update:

1. `param-list.ts` -- add the route name with a JSDoc one-liner.
2. `sections.ts` -- add a `kitSection` entry in the right `category`:
   - `foundations` -- visual atoms (Typography, Icons, Logo).
   - `components` -- reusable surfaces, controls, layout (Layout, Cards,
     Drawer, Accordion, Button, Input, Selection, Post patterns).
   - `patterns` -- domain compositions (Profile, Post).
3. `UiKit.tsx` -- register the screen on the stack.

The home screen renders the catalog grouped by category in the order
declared in `kitCategories`; the order **within** a category comes from
the order in `kitSections`.

## Demo coverage map

Every component in `apps/ui/components/` is reachable from a kit screen,
but not every component owns its screen. The current mapping:

| `apps/ui/components/...`                | Demoed on                                     |
| --------------------------------------- | --------------------------------------------- |
| `Typography.tsx` (all role helpers)     | `TypographyScreen` (foundation: `typography`) |
| `Logo.tsx`                              | `LogoScreen` (foundation: `logo`)             |
| `Page.tsx`, `Section.tsx`, `Cluster.tsx`, `Hero.tsx` | `LayoutScreen` (component: `layout`) |
| `LoadingIndicator/` (`LoadingIndicator`) | `LoadingIndicatorScreen` (component: `loading-indicator`) |
| `card/` (`Card`, `DisclosureCard`)      | `CardsScreen` (component: `cards`)            |
| `Drawer/` (`Drawer`, `DrawerItem`)      | `DrawerScreen` (component: `drawer`)          |
| `selection/` (`toggleStringInSelection`, …) | Used by selectable families; no standalone demo |
| `Pill/`, `SelectablePillGroup/`, `SelectableChecklist/`, `SelectableTopicCard/`, `SelectableTopicList/` | `SelectionScreen` (component: `selection`) |
| `StructuredTile/`, `KindHeader/`, `ProgressBar/`, `ProportionRow/`, `MetaLine/`, `ExcerptText/`, `TileFooter/`, `BorderedRow/`, `RoleCaption/`, `StatusBadge/`, `QuoteRail/` | `PostPatternsScreen` (component: `post-patterns`) |
| `Accordion/` (`Accordion`)              | `AccordionScreen` (component: `accordion`)    |
| `Button/` (`Button`, `IconButton`), `ToggleButton/` | `ButtonScreen` (component: `button`)          |
| `Input/` (`TextInput`, `TextArea`), `Select/` | `InputScreen` (component: `input`)            |
| `Avatar.tsx`, `Profile.tsx`             | `ProfileScreen` (pattern: `profile`)          |
| `Post.tsx`; archetype layouts in `Post/{Article,Liveticker,Decree,Testimony}/` | `PostScreen` (pattern: `post`) and `FeedScreen` (pattern: `feed`) |
| `PostComposer/`                         | `PostComposerScreen` (pattern: `post-composer`) |
| `Feed/` (`Feed`)                        | `FeedScreen` (pattern: `feed`)                |
| `UserProfile/` (`UserProfile`)          | `UserProfileScreen` (pattern: `user-profile`) |
| `Media/` (`Image`, `Video`, `Audio`, `Mosaic`, `Carousel`, `Dots`, `LinkPreview`) | Used by `PostScreen`, `FeedScreen`, and `PostComposerScreen`; no standalone screen today |

One kit screen doesn't correspond to anything in `apps/ui/components/`:

- `IconsScreen` -- demos the third-party `lucide-react-native` icons; no
  kit primitive wraps them today.

The kit-internal `ExampleBlock` (under `./components/`) is the
scaffolding every demo screen uses; it isn't a public primitive and
isn't demoed anywhere.

When you add a new primitive, either slot it into the matching screen
above (if it's a sibling) or add a new `kitSection` + screen in the
appropriate category.

## Shared demo data

Demo-data factories that more than one screen needs live at the top of
this folder rather than inside any single screen. Today the only such
module is `random-posts.ts`: a generator (and a small `takeFromGenerator`
consumer helper) that yields fabricated `FeedItem`s drawing from a
shared cast of authors, body pools, and per-shape media builders.

When you reach for it from a new screen:

- `randomPosts()` -- yields a uniform stream across every body shape,
  archetype teaser, and relation variant the generator implements (see
  the module header on `random-posts.ts` for the full list). What
  `FeedScreen` uses.
- `randomPosts({ shape: "carousel" })` -- pin one body shape. Reach
  for this in a shape-focused demo inside `PostScreen`, `FeedScreen`, or
  another consumer without adding a one-off kit route.

Rows are deliberately never generated with an inline `comments` array
or `showComments: true` -- feeds in this codebase keep their threads
collapsed and open them on the post-detail view, so generating
already-opened rows would be off-pattern. A screen that genuinely needs
comment data should fabricate it itself rather than re-introduce a
`showComments` option in this module.

When a new demo wants data the existing module can't produce, prefer
extending `random-posts.ts` over inlining a private generator in the
screen -- the cast and the URL helpers are exactly what new screens
will want to share with the existing ones.

## JSDoc requirements

Required on `param-list.ts`, `sections.ts`, and `random-posts.ts` --
the first two are the machine-readable catalog, the third is the
shared demo data factory consumed by other screens. All three need
their entries documented for hover docs. Optional on the demo screens
themselves (a short one-line file header is welcome but not enforced).

## Anti-patterns

- Don't put `import` lines in `usage` snippets -- show the JSX only.
- Don't add a `Kit*` prefix to anything that escapes this folder. The
  only `Kit*`-shaped thing in the kit is `ExampleBlock`, and it lives
  under `./components/` precisely because it isn't a general primitive.
