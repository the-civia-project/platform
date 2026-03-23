/**
 * Square media-grid tile for {@link "./UserProfileMediaGallery".UserProfileMediaGallery}.
 * Uses `expo-image` (same stack as {@link "../Avatar".default}) so decoded
 * bitmaps land in the memory/disk cache and tiles that were prefetched
 * paint without a visible progressive load. Until the first decode
 * finishes, the cell shows only a solid well-colour fill -- no spinner,
 * no partial image -- so a cache hit reads as instant.
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";
import type { UserProfileMediaItem } from "./UserProfileMediaGallery";

export type MediaGalleryTileProps = {
  /** Tile data from {@link UserProfileMediaItem}. */
  item: UserProfileMediaItem;
  /**
   * Sized thumbnail URL for the grid (see
   * {@link "./resolve-media-thumbnail".resolveMediaThumbnailUri}). Not the
   * full {@link UserProfileMediaItem.source} used for preview.
   */
  thumbnailUri: string;
  /** Logical side length of the square cell. */
  size: number;
};

/**
 * Renders one square tile in the profile media grid.
 *
 * @param props - {@link MediaGalleryTileProps}
 */
export function MediaGalleryTile({
  item,
  thumbnailUri,
  size,
}: MediaGalleryTileProps) {
  const theme = useTheme();
  const [decoded, setDecoded] = useState(false);

  // Warm (or re-hit) the cache before revealing the bitmap. Gallery-level
  // prefetch usually finishes first; this per-tile pass covers cells that
  // scroll into view between prefetch windows. `onLoad` remains as a
  // fallback when prefetch rejects but the decoder still succeeds.
  useEffect(() => {
    let cancelled = false;
    setDecoded(false);
    void Image.prefetch(thumbnailUri, "memory-disk")
      .then(() => {
        if (!cancelled) setDecoded(true);
      })
      .catch(() => {
        if (!cancelled) setDecoded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [thumbnailUri]);

  const image = (
    <Image
      source={{ uri: thumbnailUri }}
      accessibilityLabel={item.alt}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      style={[
        styles.image,
        { width: size, height: size, opacity: decoded ? 1 : 0 },
      ]}
      onLoad={() => setDecoded(true)}
    />
  );

  const body = item.onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.alt}
      accessibilityHint="Opens image preview"
      onPress={item.onPress}
      style={({ pressed }) => [webFocusOutlineStyle(), pressed && styles.pressed]}
    >
      {image}
    </Pressable>
  ) : (
    image
  );

  return (
    <View
      style={[
        styles.cell,
        { width: size, height: size, backgroundColor: theme.surfaceWell },
      ]}
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    overflow: "hidden",
  },
  image: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
