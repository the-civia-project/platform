# apps/ui/components AGENTS.md

Reusable kit primitives -- the shared component surface for the rest of
`apps/ui`. Callers always reach components through this layer (or the
matching family barrel), never through `react-native` directly for the
things kit primitives wrap.

Parent rules: `apps/ui/AGENTS.md` (Typography consumer rule, `core/`,
`views/`, App-level wiring) and `/AGENTS.md` (repo-wide baseline).

## Folder shape

- A component starts as `<Name>.tsx` -- one file.
- Promote it to a folder (`<Name>/<Name>.tsx` + `index.ts`) as soon as it
  grows siblings, shared internals (e.g. a `surface.ts` palette), or a
  non-trivial test surface.
- Family folders are PascalCase to match the principal component
  (`Button/`, `Drawer/`, `Input/`, `Select/`). The one outlier is `card/`
  (lowercase); rename it the next time it's touched in earnest. New
  families should always be PascalCase.
- Callers always import from the folder, not from a sibling file -- the
  barrel is the public API.
- **`Post/`** is the feed-post family: `Post/Post.tsx` (default export), the
  `Post/index.ts` barrel, and nested post-kind tiles (`Post/Article/`,
  `Post/Poll/`, …). Import `Post` from `components/Post`; import a specific
  kind from `components/Post/<Kind>` when you only need that module's types
  or component.

## File anatomy

```tsx
/**
 * One-paragraph file header: what the component is, when to use it, any
 * non-obvious behaviour (e.g. native-thread animations, theme handling,
 * accessibility caveats). Reference siblings with {@link Foo}.
 */
import { ... } from "react-native";
import { Text } from "../Typography"; // see "Typography exemption" below

/**
 * Props for {@link Foo}. JSDoc on every property, with @defaultValue for
 * optional props.
 */
export type FooProps = {
  /** Required prop -- describe what it carries. */
  source: string;
  /**
   * Optional prop -- describe behaviour and when to override.
   * @defaultValue "md"
   */
  size?: FooSize;
};

/**
 * Render summary. Explain @param semantics that aren't obvious from the type.
 *
 * @param props - {@link FooProps}
 */
export default function Foo({ source, size = "md" }: FooProps) {
  // ...
}

const styles = StyleSheet.create({
  // StyleSheet always lives at the bottom of the file.
});
```

## Exports

The kit ships two export styles. Either is fine; the rule is **pick one
per component family and let the barrel hide the choice from callers**.

- *Default-exported principal* -- the file is owned by one component.
  Used by `Avatar`, `Logo`, `Button`, `IconButton`, `Post`, `Profile`,
  `UserProfile`.
- *Named-exported principal* -- the file exports a small cluster of peers
  (e.g. `Typography`'s seven role helpers), or the principal sits
  alongside tightly-coupled helpers and types you want callers to discover
  by name. Used by `Accordion`, `Card`, `DisclosureCard`, `Drawer`,
  `DrawerItem`, `Page`, `Section`, `Hero`, `Cluster`, `TextInput`, `Select`,
  and all of `Typography`.
- Siblings, types, hooks, and constants are **always named exports** --
  regardless of the principal's style.
- A family's `index.ts` re-exports whatever shape its principal uses,
  plus every sibling named export. Two patterns are in use:

```ts
// Button/index.ts -- default principal
export { default, type ButtonProps } from "./Button";
export { default as IconButton, type IconButtonProps, ... } from "./IconButton";
export { DISABLED_OPACITY, useButtonSurface, type ButtonVariant, ... } from "./surface";
```

```ts
// Drawer/index.ts -- named principal
export { Drawer, type DrawerProps } from "./Drawer";
export {
  DrawerItem,
  type DrawerItemAccessory,
  type DrawerItemProps,
} from "./DrawerItem";
```

Whichever style a family picks, callers always import from the folder
(`import { Card } from "../components/card"`,
`import Button from "../components/Button"`) -- never from a sibling
file.

## Theming

Colours come from `components/theme.ts` (pure token tables per
`ThemeFlavor` and `ColorScheme`, `resolveTheme`) and
`components/use-theme.ts` (`useTheme`, `useResolvedColorScheme`,
`ThemeFlavorProvider`).

Rules:

- Read tokens with `const theme = useTheme();`. Do not import
  `useColorScheme` from `react-native` in this folder for theming --
  use `useResolvedColorScheme` when you need a binary light/dark
  branch (shadows, pressed overlays) without promoting a token.
- For text on flipped surfaces, use `<Text invert>` (from `Typography`)
  rather than passing colours manually -- it pulls `theme.fgInverse`
  internally.
- Pure resolvers (`Button/resolve-surface.ts`, `Post/FactCheck/resolve-surface.ts`,
  etc.) take a `Theme` argument; hooks pass `useTheme()`. Tests may
  call `resolveTheme(scheme, flavor)` from `./theme` to build a bag.
- Inline alphas that composite over non-theme pixels (e.g. `Profile` flag
  border) derive from `theme.fg` with a short local helper when needed.

Token catalogue (current `Theme` shape, see `components/theme.ts` for the
authoritative JSDoc):

| Slot              | Where it lands                                                              |
| ----------------- | --------------------------------------------------------------------------- |
| `fg`              | `Typography.Text` body; default ink                                         |
| `fgEmphasis`      | Strong labels: `DrawerItem` label, `TextInput` label+value, ghost btn label, `UserProfile` display name + active tab label + stat value |
| `fgMuted`         | `TextInput` placeholder+helper, `DrawerItem` description, quote rail, `UserProfile` handle/location/bio/meta/stat label/inactive tab labels |
| `fgInverse`       | `<Text invert>`, `Button.simple` label                                      |
| `surfaceCard`     | `Card`, `Drawer` sheet, `Button.inverted` fill, `UserProfile` avatar ring, `Feed` sticky-header wrapper |
| `surfaceSubtle`   | (no current consumer; reserved for recessed / carved-in surfaces)           |
| `surfaceInput`    | `TextInput` fill                                                            |
| `surfaceWell`     | `LogoScreen` well, `LayoutScreen` pills, `DisclosureCard` avatar tile, `UserProfile` banner placeholder |
| `surfaceInverse`  | `Avatar` placeholder, `Button.simple` fill, `TypographyScreen` flip tile    |
| `borderDefault`   | `Card`, `Hero`, `Drawer` divider, `Post` quote inset, `UserProfile` tab-bar hairline |
| `borderSubtle`    | `TextInput` idle                                                            |
| `borderEmphasis`  | `Button.ghost`, `Button.inverted` stroke                                    |
| `borderHandle`    | `Drawer` handle, well borders in `LayoutScreen` / `LogoScreen`              |
| `primary`         | `Button.primary` / `Button.link`, `Accordion` toggle, `Post` comment-active tone, `UserProfile` active tab underline |
| `onPrimary`       | Label on `primary` fills                                                    |
| `danger`          | `Button.danger`, `DrawerItem` destructive, `Post` like, `TextInput` error   |
| `onDanger`        | Label on `danger` fills                                                     |
| `success`         | `Post` repost-active tone                                                   |
| `onSuccess`       | Label on `success` fills                                                    |
| `scrim`           | `Drawer` backdrop                                                           |

Retuning the palette is a single-file change in `components/theme.ts`;
`theme.test.ts` and `Button/resolve-surface.test.ts` pin every cell so
the diff surfaces as one literal per token.

## Typography exemption

The "don't import raw RN `Text`" rule that applies in `core/`, `views/`,
and other feature code has a **leaf-level concession here**: kit
components may import raw RN `Text` when they need to paint label color
explicitly from a variant surface (e.g. `Button` does, because the
variant→color mapping lives in `Button/surface.ts` and the label needs
that color, not the themed foreground). Most components still import
`Text` from `../Typography`; reach for raw RN `Text` only when the kit
primitive owns its own color.

## Sizing & shape

When a component has size presets:

- Use the union `"xs" | "sm" | "md" | "lg" | "xl"` (subset is fine -- e.g.
  `IconButton` only ships `sm | md | lg`).
- Default to `"md"`.
- Export a `*_DIM_PX: Record<Size, number>` record alongside the type;
  if the presets need to be iterated (demos, layout math), also export a
  `*_SIZE_NAMES = [...] as const` ordered list. See `Avatar.tsx`.

When a component has shape presets, use `"rounded" | "round"` where:
- `rounded` = corner radius scaled with the size (`Math.round(dim * 0.25)`),
- `round` = full circle (`dim / 2`).

Default to `"rounded"`. See `Avatar`, `Button/IconButton`.

## Variants

Co-locate the variant union, the variant→surface resolver, and any shared
constants in a `surface.ts` sibling and export from the family's
`index.ts` so adjacent controls stay in sync. See `Button/surface.ts` --
both `Button` and `IconButton` consume the same
`useButtonSurface(variant)` hook.

## Accessibility

Every touchable/text-input component sets at minimum:

- `accessibilityRole` (`"button"`, `"link"`, ...)
- `accessibilityState={{ disabled }}` when a disabled state exists
- `accessibilityLabel` on icon-only controls (required prop, not
  optional)
- `accessibilityHint` when the action's outcome isn't obvious from the
  label

Disabled controls also drop press handlers
(`onPress={disabled ? undefined : onPress}`) and pin `activeOpacity` to
`1` so the pressable is visually inert.

## JSDoc requirements

Required throughout this directory. Every file starts with a block-level
JSDoc; every exported symbol gets JSDoc; every type property gets a
property-level comment (with `@defaultValue` for optional props).
Reference related symbols with `{@link Foo}`. See the file anatomy
example above for the shape.

## Demo requirement

Every component in this directory must be reachable from the UI Kit (see
`../views/ui-kit/AGENTS.md` for authoring rules and the coverage map).
Group related components on one screen when natural; add a new screen
only when nothing else fits.

**Creating a component** -- ship the UI Kit demo in the **same change** as
the primitive. Do not land a new `components/` export without at least one
`ExampleBlock` (or an equivalent live sample on a family screen) that
exercises the public API. Wire a new route only when no existing screen is a
natural fit (`param-list.ts`, `sections.ts`, `UiKit.tsx`); otherwise extend
the sibling screen (e.g. `Select` on `InputScreen`). Update the demo
coverage map in `views/ui-kit/AGENTS.md` when the mapping changes.

**Changing a component** -- update the kit demo in the **same change** whenever
behaviour or the public surface moves: new or renamed props/variants need a
matching row (or an updated sample); changed defaults, copy, or interaction
should be visible in `samples` and `usage` snippets on the screen listed in
the coverage map. Treat a stale demo as a bug -- do not merge component-only
diffs that leave the kit lying about how to use the control.

## Anti-patterns

- Don't reintroduce inline `isDark ? "#hex" : "#hex"` ternaries when a
  `Theme` token covers the slot. If you reach for a colour the table
  doesn't have, the right move is to add a slot to `components/theme.ts`
  (with JSDoc + a pinned cell in `theme.test.ts`), not to inline a new
  hex.
- Don't duplicate variant/palette logic across sibling controls --
  extract a shared `surface.ts` and re-export from the family barrel
  (see Button).
