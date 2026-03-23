/**
 * Thumbnail sizing and URI resolution for the profile media grid.
 * Framework-free helpers (except the optional item shape import) so tile
 * math and resolver precedence can be unit-tested without React Native.
 */
import type { UserProfileMediaItem } from "./UserProfileMediaGallery";

/** Default column count for the profile media grid. */
export const MEDIA_GRID_COLUMNS = 3;

/**
 * Logical square side length of one grid tile: window width split across
 * {@link columns} with {@link gap} hairlines between cells.
 *
 * @param windowWidth - Available horizontal space in logical px.
 * @param columns - Tiles per row.
 * @param gap - Horizontal gap between tiles in logical px.
 * @returns Tile side length in logical px.
 */
export function mediaGridTileLogicalSize(
  windowWidth: number,
  columns: number = MEDIA_GRID_COLUMNS,
  gap = 0,
): number {
  return (windowWidth - gap * (columns - 1)) / columns;
}

/**
 * Decode size for one grid thumbnail: logical tile width ×
 * {@link pixelRatio}, rounded up so retina screens fetch enough pixels
 * for a sharp square crop at the on-screen tile size.
 *
 * @param windowWidth - Available horizontal space in logical px.
 * @param pixelRatio - Device pixel ratio (`PixelRatio.get()`).
 * @param columns - Tiles per row.
 * @param gap - Horizontal gap between tiles in logical px.
 * @returns Thumbnail edge length in physical pixels.
 */
export function mediaGridThumbnailPixelSize(
  windowWidth: number,
  pixelRatio: number,
  columns: number = MEDIA_GRID_COLUMNS,
  gap = 0,
): number {
  const logical = mediaGridTileLogicalSize(windowWidth, columns, gap);
  return Math.max(1, Math.ceil(logical * pixelRatio));
}

/**
 * Builds the grid thumbnail URL for one {@link UserProfileMediaItem}.
 * Product code typically implements this against a CDN transform or an
 * API field; the demo passes a Picsum resolver.
 *
 * @param item - Media row metadata.
 * @param pixelSize - Target square edge in physical pixels (see
 *   {@link mediaGridThumbnailPixelSize}).
 * @returns Remote URL to decode in the grid.
 */
export type ResolveMediaThumbnailSource = (
  item: UserProfileMediaItem,
  pixelSize: number,
) => string;

/**
 * Resolves which URL the grid should fetch for a tile. Precedence:
 *
 * 1. {@link resolveThumbnailSource} when the parent supplies one.
 * 2. {@link UserProfileMediaItem.thumbnailSource} when set on the row.
 * 3. {@link UserProfileMediaItem.source} as a last resort (full-size).
 *
 * @param item - Media row metadata.
 * @param pixelSize - Target square edge in physical pixels.
 * @param resolveThumbnailSource - Optional parent resolver.
 * @returns Thumbnail URI for prefetch and tile decode.
 */
export function resolveMediaThumbnailUri(
  item: UserProfileMediaItem,
  pixelSize: number,
  resolveThumbnailSource?: ResolveMediaThumbnailSource,
): string {
  if (resolveThumbnailSource) {
    return resolveThumbnailSource(item, pixelSize);
  }
  if (item.thumbnailSource !== undefined) {
    return item.thumbnailSource;
  }
  return item.source;
}
