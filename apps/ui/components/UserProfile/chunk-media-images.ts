/**
 * Pure row-chunking helper for {@link "./UserProfileMediaGallery".UserProfileMediaGallery}'s
 * three-column grid. Framework-free so the grouping rules can be unit-
 * tested without pulling React Native into Vitest.
 */

/**
 * Splits a flat image list into rows of `columns` items for the recycler.
 * The final row may contain fewer than `columns` entries; the row renderer
 * pads the remainder with inert spacers so tile widths stay even.
 *
 * @param images - Flat image list, in display order.
 * @param columns - Tiles per row. Defaults to `3`.
 * @returns Row chunks, each holding up to `columns` items.
 */
export function chunkMediaImages<T>(
  images: readonly T[],
  columns: number = 3,
): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < images.length; i += columns) {
    rows.push(images.slice(i, i + columns) as T[]);
  }
  return rows;
}
