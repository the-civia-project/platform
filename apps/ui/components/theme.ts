/**
 * Kit-wide colour palette: the single source of truth for every themed surface,
 * foreground, border, and accent the components in this folder paint. Replaces
 * the previous "co-locate isDark ternaries with the component" rule -- as the
 * kit grew past Avatar, Card, Hero, Drawer, DrawerItem, TextInput, Button, and
 * Post, each component reached for the same conceptual slots ("subtle surface",
 * "muted text", "well", ...) and reinventing them inline was producing visible
 * drift (e.g. LayoutScreen's pill bg and LogoScreen's well bg disagreed by one
 * neutral stop). Centralising lets a future re-theme stay a literal-edit.
 *
 * This file ships multiple **flavours** ({@link ThemeFlavor}), each with light
 * and dark {@link Theme} bags:
 * - **gazette** — warm cream / walnut editorial civic palette.
 * - **matrix** — phosphor lime on deep green-black; light "terminal paper".
 * - **default** — grayscale neutrals with violet accent; red errors, green reposts (product default).
 * - **pulse** — electric violet on cool gray-violet neutrals (social / feed energy).
 * - **ember** — sunset coral: peachy shell surfaces, pink-orange brand accent
 *   (light), and ember-glow coral on wine-tinted charcoal (dark).
 *
 * @todo Layer user-owned **skin** overrides (MySpace-style profile customization:
 *   hero backgrounds, accent picks, maybe “modular” embed slots) on top of flavour
 *   bags so a social client can feel personal without shipping a new
 *   {@link ThemeFlavor} variant per member.
 *
 * Intentionally framework-free: no React, no React Native, no hooks -- so the
 * tokens can be unit-tested in Node and pulled from pure resolvers (e.g.
 * {@link "./Button/resolve-surface"}'s variant table). The stateful wrapper
 * {@link useTheme} lives in `./use-theme` and composes {@link resolveTheme}
 * with the device colour scheme and optional flavour context for runtime consumers.
 *
 * Token-bag references are stable across calls -- consumers spread individual
 * primitive values into `StyleSheet` objects, never the whole bag, so there's
 * no aliasing concern.
 */

/**
 * Active appearance the palette is being resolved for. Explicit string union
 * rather than a boolean because `resolveTheme("dark", flavor)` reads at the
 * call-site while `resolveTheme(true)` would require the reader to remember
 * which boolean means dark. Consumers pulling the scheme from React Native's
 * `useColorScheme()` should map `null` (uninitialised on some platforms) to
 * `"light"` to match the historical default.
 */
export type ColorScheme = "light" | "dark";

/**
 * Named theme flavour: which palette family {@link resolveTheme} returns for a
 * given {@link ColorScheme}. The UI Kit exposes a switcher; product code defaults
 * to `"default"`.
 */
export type ThemeFlavor =
  /**
   * Editorial Gazette palette -- warm cream surfaces, walnut dark, navy primary.
   */
  | "gazette"
  /**
   * Matrix-inspired phosphor lime accents on near-black (dark) and soft
   * mint-terminal paper (light).
   */
  | "matrix"
  /**
   * Grayscale base with a violet accent; red reserved for
   * {@link Theme.danger}. Product default.
   * @defaultValue Used when {@link resolveTheme}'s flavour is omitted or no provider sets flavour.
   */
  | "default"
  /**
   * Social / feed aesthetic: violet brand accent on cool gray-violet neutrals.
   */
  | "pulse"
  /**
   * Coral sunset: pink-orange primary on blush-peach neutrals (light) and warm
   * coral highlights on deep rose charcoal (dark).
   */
  | "ember";

/**
 * Resolved palette for one {@link ColorScheme} within a flavour. Every slot is
 * required so the compiler catches forgotten tokens when a new colour need
 * surfaces -- the kit has been bitten by inline ternaries falling out of sync,
 * and the type system is the cheapest place to catch that.
 */
export type Theme = {
  /**
   * Primary page / body text colour. Used as the foreground of
   * {@link "./Typography".Text} and anywhere kit components paint neutral copy.
   */
  fg: string;
  /**
   * Strong text colour for labels, input values, and ghost-button labels. A
   * notch deeper than {@link fg} so it reads as "title/label, not body".
   */
  fgEmphasis: string;
  /**
   * Muted text colour for helper rows, placeholders, and captions. Mid-contrast
   * neutral that still meets readability on the matching surface tokens.
   */
  fgMuted: string;
  /**
   * Foreground for text painted on a surface that intentionally flips the
   * active scheme (e.g. `<Text invert>`, {@link "./Button"}'s `simple` variant
   * label). Always paired with {@link surfaceInverse}.
   */
  fgInverse: string;

  /**
   * Card / drawer-sheet fill -- deliberately matches (or near-matches) the
   * page background so the card reads as a "transparent" framed area of the
   * page rather than a raised slab. In light mode that's typically near-white;
   * in dark mode a near-black tuned to the flavour. Pair with `borderDefault`
   * for the canonical card frame.
   */
  surfaceCard: string;
  /**
   * Recessed surface fill: "carved in" blocks that should read as *behind*
   * the page rather than raised above it.
   */
  surfaceSubtle: string;
  /**
   * Form-field fill: {@link "./Input/TextInput".TextInput}'s pill. Slightly
   * deeper than {@link surfaceSubtle} so inputs read as distinct affordances
   * even before focus.
   */
  surfaceInput: string;
  /**
   * Compact-chip fill: pills, wells, leading avatar tiles. Used by the UI Kit
   * `LayoutScreen` pills, `LogoScreen` wells, and `DisclosureCard`'s avatar
   * square so all three end up consistent.
   */
  surfaceWell: string;
  /**
   * Flipped surface: {@link "./Button"}'s `simple` variant fill, the
   * {@link "./Avatar"} placeholder behind transparent PNGs, the
   * `TypographyScreen` "Text invert" tile. Pair with {@link fgInverse} for text.
   */
  surfaceInverse: string;

  /**
   * Default hairline border: cards, hero panel, the quote inset. Visible
   * against {@link surfaceCard} and {@link surfaceSubtle} on both schemes.
   */
  borderDefault: string;
  /**
   * Idle border for form fields ({@link "./Input/TextInput".TextInput}). A
   * touch softer than {@link borderDefault} so an unfocused input feels quiet.
   */
  borderSubtle: string;
  /**
   * Emphasised border for {@link "./Button"}'s `ghost` and `inverted` variants.
   * Strong enough to read as a deliberate stroke without competing with the
   * label.
   */
  borderEmphasis: string;
  /**
   * Handle / well border: the {@link "./Drawer"} grabber, the UI Kit
   * `LayoutScreen` pill borders, `LogoScreen` well borders, and the
   * `TypographyScreen` flip-tile border. Mid-tone so the chrome doesn't
   * disappear on either surface.
   */
  borderHandle: string;

  /**
   * Brand accent fill: {@link "./Button"}'s `primary` and `link` variants,
   * Post's `comment` active tone. Paired with {@link onPrimary} for text.
   */
  primary: string;
  /**
   * Foreground painted on top of {@link primary}. Kept `#ffffff` across flavours
   * so accent buttons stay legible on saturated fills.
   */
  onPrimary: string;
  /**
   * Destructive accent fill: {@link "./Button"}'s `danger` variant,
   * {@link "./Drawer/DrawerItem".DrawerItem}'s destructive treatment,
   * Post's `liked` tone, {@link "./Input/TextInput".TextInput}'s error border
   * and copy.
   */
  danger: string;
  /**
   * Foreground painted on top of {@link danger}. Kept `#ffffff` for consistent
   * destructive affordances.
   */
  onDanger: string;
  /**
   * Success accent: Post's `reposted` tone. Currently only used as a
   * foreground (icon stroke, count colour) in many places; the `on*` companion
   * is kept for symmetry when used as a fill.
   */
  success: string;
  /**
   * Foreground painted on top of {@link success} when used as a fill.
   */
  onSuccess: string;

  /**
   * Darken overlay behind a modal / drawer. Pinned at the same value for both
   * schemes -- a scrim is always "darken what's underneath".
   */
  scrim: string;
};

/**
 * Gazette light palette: warm cream surfaces, walnut "ink" for flipped slabs,
 * deep navy / brick / olive accents.
 */
const GAZETTE_LIGHT_THEME: Theme = Object.freeze({
  fg: "#1f1810",
  fgEmphasis: "#2a1f15",
  fgMuted: "#7a6a55",
  fgInverse: "#f5ecdb",

  surfaceCard: "#ffffff",
  surfaceSubtle: "#f3ecdc",
  surfaceInput: "#efe6d2",
  surfaceWell: "#e6dcc4",
  surfaceInverse: "#241b13",

  borderDefault: "#dccfb3",
  borderSubtle: "#e2d6bc",
  borderEmphasis: "#b8a47e",
  borderHandle: "#cdbf9c",

  primary: "#1d4ed8",
  onPrimary: "#ffffff",
  danger: "#b91c1c",
  onDanger: "#ffffff",
  success: "#65a30d",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Gazette dark palette: walnut surfaces, parchment "paper" for flipped slabs.
 */
const GAZETTE_DARK_THEME: Theme = Object.freeze({
  fg: "#f5ecdb",
  fgEmphasis: "#fff5e0",
  fgMuted: "#a89881",
  fgInverse: "#241b13",

  surfaceCard: "#0c0805",
  surfaceSubtle: "#1c150e",
  surfaceInput: "#2c2118",
  surfaceWell: "#33271c",
  surfaceInverse: "#f5ecdb",

  borderDefault: "#3d2f22",
  borderSubtle: "#3a2c20",
  borderEmphasis: "#5e4d3c",
  borderHandle: "#3a2d20",

  primary: "#4d83df",
  onPrimary: "#ffffff",
  danger: "#dc2626",
  onDanger: "#ffffff",
  success: "#84cc16",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Matrix light: soft mint "terminal paper", deep forest copy, saturated lime primary.
 */
const MATRIX_LIGHT_THEME: Theme = Object.freeze({
  fg: "#0f1f14",
  fgEmphasis: "#14532d",
  fgMuted: "#3f6b52",
  fgInverse: "#ecfdf5",

  surfaceCard: "#f3faf5",
  surfaceSubtle: "#e5f4eb",
  surfaceInput: "#d7ecdd",
  surfaceWell: "#c5e4cf",
  surfaceInverse: "#052e1a",

  borderDefault: "#9dc4ae",
  borderSubtle: "#b5d4c3",
  borderEmphasis: "#4ade80",
  borderHandle: "#86c79a",

  primary: "#16a34a",
  onPrimary: "#ffffff",
  danger: "#b91c1c",
  onDanger: "#ffffff",
  success: "#15803d",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Matrix dark: phosphor green on near-black, CRT-style depth without sacrificing contrast.
 */
const MATRIX_DARK_THEME: Theme = Object.freeze({
  fg: "#86efac",
  fgEmphasis: "#bbf7d0",
  fgMuted: "#4ade80",
  fgInverse: "#020806",

  surfaceCard: "#020a06",
  surfaceSubtle: "#061810",
  surfaceInput: "#0c2618",
  surfaceWell: "#0f3320",
  surfaceInverse: "#bbf7d0",

  borderDefault: "#166534",
  borderSubtle: "#14532d",
  borderEmphasis: "#22c55e",
  borderHandle: "#15803d",

  primary: "#22c55e",
  onPrimary: "#ffffff",
  danger: "#f87171",
  onDanger: "#ffffff",
  success: "#4ade80",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Pulse light: cool paper with violet primary and blue-gray neutrals.
 */
const PULSE_LIGHT_THEME: Theme = Object.freeze({
  fg: "#1a162e",
  fgEmphasis: "#2d2648",
  fgMuted: "#6b6589",
  fgInverse: "#faf5ff",

  surfaceCard: "#ffffff",
  surfaceSubtle: "#f5f3ff",
  surfaceInput: "#ede9fe",
  surfaceWell: "#ddd6fe",
  surfaceInverse: "#3b0764",

  borderDefault: "#d4c9f5",
  borderSubtle: "#e0d8fc",
  borderEmphasis: "#8b5cf6",
  borderHandle: "#c4b5fd",

  primary: "#7c3aed",
  onPrimary: "#ffffff",
  danger: "#e11d48",
  onDanger: "#ffffff",
  success: "#059669",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Pulse dark: OLED-adjacent graphite with electric violet accents.
 */
const PULSE_DARK_THEME: Theme = Object.freeze({
  fg: "#ede9fe",
  fgEmphasis: "#faf5ff",
  fgMuted: "#8b7fb5",
  fgInverse: "#130a24",

  surfaceCard: "#0a0814",
  surfaceSubtle: "#131024",
  surfaceInput: "#1c1633",
  surfaceWell: "#241d40",
  surfaceInverse: "#ede9fe",

  borderDefault: "#362f52",
  borderSubtle: "#2e2845",
  borderEmphasis: "#a78bfa",
  borderHandle: "#4c3f75",

  primary: "#a78bfa",
  onPrimary: "#ffffff",
  danger: "#fb7185",
  onDanger: "#ffffff",
  success: "#34d399",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Ember light: blush shell surfaces, wine-brown copy, vivid coral brand.
 */
const EMBER_LIGHT_THEME: Theme = Object.freeze({
  fg: "#281418",
  fgEmphasis: "#3a1f22",
  fgMuted: "#8f6268",
  fgInverse: "#fff5f3",

  surfaceCard: "#fff9f7",
  surfaceSubtle: "#ffefea",
  surfaceInput: "#ffe4dc",
  surfaceWell: "#ffd3c4",
  surfaceInverse: "#2a1418",

  borderDefault: "#e2b8ae",
  borderSubtle: "#eed0c8",
  borderEmphasis: "#cc5a4a",
  borderHandle: "#d49a8e",

  primary: "#f54e36",
  onPrimary: "#ffffff",
  danger: "#e11d48",
  onDanger: "#ffffff",
  success: "#15803d",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Ember dark: wine charcoal, peachy copy, glowing pink-orange primary.
 */
const EMBER_DARK_THEME: Theme = Object.freeze({
  fg: "#ffebe3",
  fgEmphasis: "#fff4ee",
  fgMuted: "#c49388",
  fgInverse: "#1e1214",

  surfaceCard: "#110d0e",
  surfaceSubtle: "#1a1416",
  surfaceInput: "#261c1f",
  surfaceWell: "#33262a",
  surfaceInverse: "#fff4ee",

  borderDefault: "#523d42",
  borderSubtle: "#423338",
  borderEmphasis: "#ff8a6d",
  borderHandle: "#5e4549",

  primary: "#ff8f77",
  onPrimary: "#ffffff",
  danger: "#fb7185",
  onDanger: "#ffffff",
  success: "#4ade80",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Default light: white paper, black ink, gray structure; violet accent, red errors.
 */
const DEFAULT_LIGHT_THEME: Theme = Object.freeze({
  fg: "#141414",
  fgEmphasis: "#000000",
  fgMuted: "#6b6b6b",
  fgInverse: "#ffffff",

  surfaceCard: "#ffffff",
  surfaceSubtle: "#f7f7f7",
  surfaceInput: "#ededed",
  surfaceWell: "#e0e0e0",
  surfaceInverse: "#141414",

  borderDefault: "#cccccc",
  borderSubtle: "#d9d9d9",
  borderEmphasis: "#8b5cf6",
  borderHandle: "#b3b3b3",

  primary: "#7c3aed",
  onPrimary: "#ffffff",
  danger: "#dc2626",
  onDanger: "#ffffff",
  success: "#15803d",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

/**
 * Default dark: near-black surfaces, light gray copy, violet accent fills.
 */
const DEFAULT_DARK_THEME: Theme = Object.freeze({
  fg: "#f5f5f5",
  fgEmphasis: "#ffffff",
  fgMuted: "#a3a3a3",
  fgInverse: "#141414",

  surfaceCard: "#0a0a0a",
  surfaceSubtle: "#141414",
  surfaceInput: "#1f1f1f",
  surfaceWell: "#2a2a2a",
  surfaceInverse: "#f5f5f5",

  borderDefault: "#3d3d3d",
  borderSubtle: "#333333",
  borderEmphasis: "#c4b5fd",
  borderHandle: "#525252",

  primary: "#a78bfa",
  onPrimary: "#ffffff",
  danger: "#ef4444",
  onDanger: "#ffffff",
  success: "#34d399",
  onSuccess: "#ffffff",

  scrim: "rgba(0,0,0,0.45)",
});

const THEME_BY_FLAVOR_AND_SCHEME: Record<
  ThemeFlavor,
  Record<ColorScheme, Theme>
> = Object.freeze({
  default: Object.freeze({
    light: DEFAULT_LIGHT_THEME,
    dark: DEFAULT_DARK_THEME,
  }),
  gazette: Object.freeze({
    light: GAZETTE_LIGHT_THEME,
    dark: GAZETTE_DARK_THEME,
  }),
  matrix: Object.freeze({
    light: MATRIX_LIGHT_THEME,
    dark: MATRIX_DARK_THEME,
  }),
  pulse: Object.freeze({
    light: PULSE_LIGHT_THEME,
    dark: PULSE_DARK_THEME,
  }),
  ember: Object.freeze({
    light: EMBER_LIGHT_THEME,
    dark: EMBER_DARK_THEME,
  }),
});

/**
 * Maps a {@link ColorScheme} and {@link ThemeFlavor} to a resolved palette.
 * Pure: no React, no platform APIs, deterministic in its inputs. Returns a
 * shared reference (not a fresh object) because consumers read individual
 * primitive properties rather than spreading the whole bag.
 *
 * @param scheme - {@link ColorScheme} to resolve. Consumers reading from
 *   `useColorScheme()` should map `null` to `"light"`.
 * @param flavor - {@link ThemeFlavor} palette family. Defaults to `"default"`.
 * @returns A frozen {@link Theme} -- safe to memoise upstream.
 */
export function resolveTheme(
  scheme: ColorScheme,
  flavor: ThemeFlavor = "default",
): Theme {
  const pair = THEME_BY_FLAVOR_AND_SCHEME[flavor];
  return scheme === "dark" ? pair.dark : pair.light;
}
