/**
 * Turns a `#RRGGBB` string from {@link ../theme}.`Theme` into `rgba(...)` for SVG fills
 * and strokes. Used only by {@link "./ThemePatternBackground"} so pattern inks stay
 * token-driven without adding opacity fields to the theme bag.
 *
 * Non-hex strings are returned unchanged so future token formats fail soft at runtime
 * rather than throwing during paint.
 *
 * @param hex - Colour like `#1a162e` or `#fff` (three-digit not handled — kit uses six).
 * @param alpha - Multiplier in \([0, 1]\).
 * @returns `rgba(r,g,b,a)` or the original `hex` when parsing fails.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) {
    return hex;
  }
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
