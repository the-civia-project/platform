/**
 * Pure helpers for {@link Select} sheet keyboard highlight index on web.
 * Kept framework-free so Node tests can pin arrow/enter navigation math.
 */

/**
 * Highlight index when the sheet opens or the filtered list changes: first row,
 * or `-1` when there is nothing to pick.
 */
export function initialSelectHighlightIndex(optionCount: number): number {
  return optionCount > 0 ? 0 : -1;
}

/**
 * Clamps a highlight index into `[0, optionCount - 1]`, or `-1` when empty.
 */
export function clampSelectHighlightIndex(
  index: number,
  optionCount: number,
): number {
  if (optionCount <= 0) return -1;
  return Math.max(0, Math.min(index, optionCount - 1));
}

/**
 * Moves the highlight by `delta` (−1 up, +1 down) with clamping at the ends.
 */
export function moveSelectHighlightIndex(
  current: number,
  delta: -1 | 1,
  optionCount: number,
): number {
  if (optionCount <= 0) return -1;
  return clampSelectHighlightIndex(current + delta, optionCount);
}
