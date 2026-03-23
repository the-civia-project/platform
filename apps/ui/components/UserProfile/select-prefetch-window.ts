/**
 * Pure helpers for choosing which media-tab image URLs to warm in the
 * cache ahead of the user's scroll position. Framework-free so the
 * windowing rules can be unit-tested without React Native.
 */

/**
 * Returns a de-duplicated slice of `uris` covering the index range
 * `[fromIndex, fromIndex + count)` clamped to the array bounds.
 * Order is preserved; later duplicates in the range are dropped.
 *
 * @param uris - Full URI list in display order.
 * @param fromIndex - First index to include.
 * @param count - Maximum number of URIs to return.
 * @returns URIs to prefetch, in order, without repeats.
 */
export function selectPrefetchWindow(
  uris: readonly string[],
  fromIndex: number,
  count: number,
): string[] {
  if (count <= 0 || uris.length === 0) return [];
  const start = Math.max(0, fromIndex);
  const slice = uris.slice(start, start + count);
  return [...new Set(slice)];
}

/**
 * Chooses URIs to warm when the visible window ends at
 * `lastVisibleImageIndex`: a small band behind the viewport plus a
 * larger band ahead so fast scroll still hits disk/memory cache.
 *
 * @param uris - Full URI list in display order.
 * @param lastVisibleImageIndex - Highest image index currently on screen.
 * @param behind - How many URIs before the index to re-warm.
 * @param ahead - How many URIs after the index to prefetch.
 * @returns De-duplicated URIs to prefetch.
 */
export function selectPrefetchAroundVisible(
  uris: readonly string[],
  lastVisibleImageIndex: number,
  behind: number,
  ahead: number,
): string[] {
  const from = Math.max(0, lastVisibleImageIndex - behind);
  const count = behind + ahead + 1;
  return selectPrefetchWindow(uris, from, count);
}
