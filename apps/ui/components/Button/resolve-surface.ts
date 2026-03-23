/**
 * Pure variant palette for {@link Button} / {@link IconButton}. Owns the
 * variant and surface types and the single function that maps a variant +
 * resolved {@link Theme} to its fill / foreground / border.
 *
 * Intentionally framework-free: no React, no React Native, no hooks. The
 * stateful wrapper {@link useButtonSurface} lives in `./surface` and
 * composes this function with {@link useTheme}. The {@link Theme} argument is
 * produced by {@link "../theme".resolveTheme} in tests or {@link useTheme} at runtime.
 *
 * Variant→token mapping pulls colours from the passed {@link Theme}; this file
 * owns the variant *shape* (border-or-no-border, underline-or-not,
 * accent-or-neutral).
 */
import type { Theme } from "../theme";

/**
 * Named visual style shared by {@link Button} and {@link IconButton}.
 *
 * - `simple` -- high-contrast solid fill: the active scheme's inverse surface
 *   ({@link Theme.surfaceInverse}) with the matching inverse foreground
 *   ({@link Theme.fgInverse}). Reads as "ink stamp on paper" in the Gazette
 *   palette -- walnut-on-cream in light mode, cream-on-walnut in dark mode.
 * - `inverted` -- raised-surface treatment: the active scheme's card fill
 *   ({@link Theme.surfaceCard}) with the body foreground ({@link Theme.fg})
 *   and a hairline emphasis stroke ({@link Theme.borderEmphasis}). Reads as
 *   a chrome-on-page button rather than the high-contrast `simple` shape; the
 *   border keeps it visible when it floats over a same-toned card surface
 *   (e.g. a post's overflow menu where wrapped text might otherwise bleed
 *   through a transparent button).
 * - `primary` -- brand-accent fill ({@link Theme.primary}) paired with
 *   {@link Theme.onPrimary} for the label.
 * - `danger` -- destructive accent fill ({@link Theme.danger}) paired with
 *   {@link Theme.onDanger} for the label.
 * - `ghost` -- transparent fill with a hairline emphasis border
 *   ({@link Theme.borderEmphasis}) and the emphasis text colour
 *   ({@link Theme.fgEmphasis}).
 * - `full-ghost` -- transparent fill with no border; just the emphasis text
 *   colour. Use for the lowest-emphasis inline actions (e.g. `Cancel` next
 *   to a primary `Save`, menu dismiss, overflow toggles).
 * - `link` -- transparent fill with no border and the brand-accent text
 *   colour ({@link Theme.primary}), plus an underline on the label. Reads as
 *   an inline hyperlink rather than a button; reserve for cross-page
 *   references in body copy (`Learn more`, `Privacy policy`). On
 *   {@link IconButton} the underline has no effect -- only the brand colour
 *   applies.
 */
export type ButtonVariant =
  | "simple"
  | "inverted"
  | "primary"
  | "danger"
  | "ghost"
  | "full-ghost"
  | "link";

/**
 * Resolved colors and border for one {@link ButtonVariant} (enabled only --
 * the disabled treatment is applied as a separate opacity overlay).
 */
export type ButtonSurface = {
  /** Background fill behind the label/icon. */
  backgroundColor: string;
  /** Label/icon foreground color. */
  color: string;
  /** Border width in logical pixels (`0` when the variant has no stroke). */
  borderWidth: number;
  /** Border color (ignored when `borderWidth` is 0). */
  borderColor: string;
  /**
   * Optional text decoration for the label (e.g. `"underline"` for the `link` variant).
   * {@link IconButton} ignores it since it has no text.
   */
  textDecorationLine?: "underline";
};

/**
 * Spread-friendly "no border" preset. Hoisted to module scope so every call returns
 * structurally identical objects without paying for a fresh literal each time, and so
 * the test file can reference the same constant if it ever needs to.
 */
const NO_BORDER = { borderWidth: 0, borderColor: "transparent" } as const;

/**
 * Maps a variant + {@link Theme} to its resolved surface. Pure: no React, no platform
 * APIs. Pass a bag from {@link useTheme} or {@link "../theme".resolveTheme}.
 *
 * @param variant - {@link ButtonVariant} to resolve.
 * @param theme - Resolved palette (same shape as {@link useTheme} returns).
 * @returns A fresh {@link ButtonSurface}; the result is safe to spread into a
 *   StyleSheet object without aliasing concerns.
 */
export function resolveButtonSurface(
  variant: ButtonVariant,
  theme: Theme,
): ButtonSurface {
  const t = theme;

  if (variant === "danger") {
    return { backgroundColor: t.danger, color: t.onDanger, ...NO_BORDER };
  }

  if (variant === "primary") {
    return { backgroundColor: t.primary, color: t.onPrimary, ...NO_BORDER };
  }

  if (variant === "ghost") {
    return {
      backgroundColor: "transparent",
      color: t.fgEmphasis,
      borderWidth: 1,
      borderColor: t.borderEmphasis,
    };
  }

  if (variant === "full-ghost") {
    return {
      backgroundColor: "transparent",
      color: t.fgEmphasis,
      ...NO_BORDER,
    };
  }

  if (variant === "link") {
    return {
      backgroundColor: "transparent",
      color: t.primary,
      textDecorationLine: "underline",
      ...NO_BORDER,
    };
  }

  if (variant === "inverted") {
    return {
      backgroundColor: t.surfaceCard,
      color: t.fg,
      borderWidth: 1,
      borderColor: t.borderEmphasis,
    };
  }

  return {
    backgroundColor: t.surfaceInverse,
    color: t.fgInverse,
    ...NO_BORDER,
  };
}
