/**
 * Background cache warming for {@link "./UserProfileMediaGallery".UserProfileMediaGallery}
 * tiles. Wraps `expo-image`'s prefetch so the gallery can decode ahead of
 * the recycler without pulling image components into the prefetch path.
 */
import { Image } from "expo-image";

/**
 * Warms the memory/disk cache for each URI. Failures are swallowed so a
 * single bad asset never blocks the rest of the window.
 *
 * @param uris - Remote image URLs to prefetch.
 */
export async function prefetchMediaImageUris(uris: readonly string[]): Promise<void> {
  await Promise.all(
    uris.map(async (uri) => {
      try {
        await Image.prefetch(uri, "memory-disk");
      } catch {
        // Best-effort warming; the tile still attempts a normal load.
      }
    }),
  );
}
