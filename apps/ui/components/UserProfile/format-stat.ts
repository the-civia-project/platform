/**
 * Numeric formatter for {@link "./UserProfile".default}'s stats row
 * and tab-strip counts. K / M abbreviation past 1,000 / 1,000,000 so
 * `"1.2K Followers"` reads cleanly at phone widths instead of
 * `"1,234,567 Followers"` wrapping onto two lines.
 *
 * Framework-free (no React, no React Native) so the math can be
 * unit-tested in Node alongside the rest of the resolver siblings in
 * this folder. The K-vs-M-vs-raw decision is the only piece of policy
 * here; the typography (bold value + muted label) lives in
 * `UserProfile.tsx`.
 */

/**
 * Formats a non-negative integer for display in the stats row and
 * the tab strip. Values under 1,000 render as-is; values in
 * `[1_000, 1_000_000)` render with a `K` suffix and one decimal
 * (the trailing `.0` stripped); values at or above `1_000_000`
 * render with an `M` suffix and the same one-decimal convention.
 * Negative inputs are clamped to 0 -- the prop type permits any
 * number, but a negative follower count is incoherent in this
 * context, so clamping reads as "this is a display helper, not a
 * parser". Non-finite inputs (NaN, Infinity) are also clamped to 0
 * for the same reason: a stat row should never render `"NaN"` or
 * `"InfinityM"` even when upstream data is broken.
 *
 * @param value - The raw count to format.
 * @returns The display string (e.g. `"0"`, `"42"`, `"1.2K"`,
 *   `"15M"`).
 */
export function formatStatValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const clamped = Math.max(0, value);
  if (clamped >= 1_000_000) {
    return stripTrailingZero((clamped / 1_000_000).toFixed(1)) + "M";
  }
  if (clamped >= 1_000) {
    return stripTrailingZero((clamped / 1_000).toFixed(1)) + "K";
  }
  return String(Math.floor(clamped));
}

/**
 * Trims a trailing `.0` off a fixed-1 decimal string so `"15.0K"`
 * renders as `"15K"` while `"1.2K"` stays untouched. Module-private
 * because the suffix-formatting rule it implements only makes sense
 * paired with {@link formatStatValue}.
 */
function stripTrailingZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}
