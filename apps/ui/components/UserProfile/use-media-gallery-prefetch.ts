/**
 * React hook that keeps the profile media grid's image cache ahead of
 * the user's scroll position and nudges the parent to grow the in-memory
 * list before the viewport runs dry.
 */
import { useEffect, useRef } from "react";
import type { UserProfileMediaItem } from "./UserProfileMediaGallery";
import { prefetchMediaImageUris } from "./prefetch-media-images";
import { selectPrefetchAroundVisible } from "./select-prefetch-window";

/** Minimum images kept in memory before requesting another page. */
export const MEDIA_GALLERY_MIN_BUFFER = 45;

/** URIs warmed behind the last visible tile. */
const PREFETCH_BEHIND = 6;

/** URIs warmed ahead of the last visible tile. */
const PREFETCH_AHEAD = 36;

/**
 * Warms image caches and proactively calls {@link onEndReached} while
 * the buffered image count sits below {@link MEDIA_GALLERY_MIN_BUFFER}.
 *
 * @param images - Images currently in the tab.
 * @param hasMore - Whether the parent can still append pages.
 * @param onEndReached - Parent paging callback.
 * @param lastVisibleImageIndex - Highest image index on screen; `-1` when
 *   unknown (falls back to warming from the start of the list).
 * @param resolveThumbnail - Maps each item to the sized thumbnail URI the
 *   grid decodes (not {@link UserProfileMediaItem.source}).
 */
export function useMediaGalleryPrefetch(
  images: readonly UserProfileMediaItem[],
  hasMore: boolean,
  onEndReached: () => void,
  lastVisibleImageIndex: number,
  resolveThumbnail: (item: UserProfileMediaItem) => string,
): void {
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    loadingMoreRef.current = false;
  }, [images.length]);

  useEffect(() => {
    if (!hasMore) return;
    if (images.length >= MEDIA_GALLERY_MIN_BUFFER) return;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    onEndReached();
  }, [images.length, hasMore, onEndReached]);

  useEffect(() => {
    if (images.length === 0) return;
    const uris = images.map((item) => resolveThumbnail(item));
    const anchor =
      lastVisibleImageIndex >= 0 ? lastVisibleImageIndex : uris.length - 1;
    const window = selectPrefetchAroundVisible(
      uris,
      anchor,
      PREFETCH_BEHIND,
      PREFETCH_AHEAD,
    );
    void prefetchMediaImageUris(window);
  }, [images, lastVisibleImageIndex, resolveThumbnail]);
}
