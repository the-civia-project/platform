/**
 * Vertical stack of differently-shaped images. Each tile is a full-width
 * {@link Image} sized to its own declared `aspectRatio`, packed flush
 * against the next tile (no inter-tile gap) so the stack reads as one
 * tall collage rather than a sequence of independent photos. Unlike a
 * Twitter-style gallery (uniform grid) this preserves every photo's
 * natural shape; use a mosaic when a post deliberately mixes landscape,
 * portrait, and square shots and cropping them into uniform tiles would
 * lose information.
 *
 * Only the outer corners of the stack are rounded: the first tile rounds
 * its top corners, the last tile rounds its bottom corners, and every tile
 * in between is fully square. With the tiles flush (no gap) this gives the
 * mosaic the same outline as a single rounded rectangle -- the kit's
 * standard "stack of media" silhouette -- rather than N independently-
 * rounded photos boxed in a column. {@link Image}'s
 * `rounded={"top" | "bottom" | false}` literals encode this directly so
 * the call site stays declarative.
 *
 * Falls back to a single {@link Image} when there's only one photo --
 * a one-tile "mosaic" is visually identical to a single-image post, and
 * delegating keeps the rendering of "single image" code-pathed through one
 * component regardless of which media variant the caller picked. The
 * fallback inherits {@link Image}'s default `rounded={true}`, so a single-
 * image mosaic still reads as a regular fully-rounded photo.
 *
 * The "differently-shaped" contract is encoded two ways:
 *
 * 1. {@link MosaicImage.aspectRatio} is **required** -- every tile must
 *    declare its shape at the type level, which makes it visible at the
 *    call site that the variant is supposed to be heterogeneous.
 * 2. In `__DEV__` builds, emits a `console.warn` when every image happens
 *    to share the same aspect ratio at runtime. TypeScript can't express
 *    "every value differs", so this is the closest we can get -- a polite
 *    nudge towards {@link Carousel} (swipeable, uniform) for same-shape
 *    sequences during development, silent in production.
 *
 * @example
 * ```tsx
 * <Mosaic
 *   images={[
 *     { source: "https://...", alt: "Landscape shot", aspectRatio: 16 / 9 },
 *     { source: "https://...", alt: "Square crop", aspectRatio: 1 },
 *     { source: "https://...", alt: "Portrait", aspectRatio: 4 / 5 },
 *   ]}
 *   onImagePress={(index) => openPreviewer(index)}
 * />
 * ```
 */
import { StyleSheet, View } from "react-native";
import { Image } from "./Image";

/**
 * Tile-data shape for {@link Mosaic}. Identical to {@link ImageData} except
 * that `aspectRatio` is *required* -- mosaic posts exist to mix differently-
 * shaped photos, so every tile must declare its shape rather than fall back
 * to a default. Callers who find themselves picking the same value every
 * time should reach for {@link Carousel} (swipeable sequence) or a gallery
 * grid (at-a-glance grid).
 */
export type MosaicImage = {
  /** Remote image URL. Passed straight to RN `Image` as the `uri` source. */
  source: string;
  /**
   * Screen-reader description of the image's content. Same accessibility
   * contract as {@link ImageData.alt}.
   */
  alt: string;
  /**
   * Display aspect ratio (width / height) for this tile. Required because
   * the whole point of `mosaic` is to preserve each photo's natural shape:
   * the layout uses this value to size the tile's height for its full-width
   * column. Think of it as "tell the mosaic what shape this photo is".
   */
  aspectRatio: number;
};

/**
 * Public props for {@link Mosaic}.
 */
export type MosaicProps = {
  /**
   * Photos to render, top-to-bottom. Each tile renders at full inline
   * width and at its declared {@link MosaicImage.aspectRatio}. A 6px
   * vertical gap separates adjacent tiles.
   */
  images: MosaicImage[];
  /**
   * Optional press handler invoked with the 0-based index of the tapped
   * tile. Wire to your full-screen previewer so it opens at the matching
   * slide.
   */
  onImagePress?: (index: number) => void;
};

/**
 * Renders a vertical stack of full-width {@link Image} tiles, each at its
 * own declared aspect ratio.
 *
 * @param props - {@link MosaicProps}
 */
export function Mosaic({ images, onImagePress }: MosaicProps) {
  if (images.length === 0) return null;

  const handlerFor = onImagePress
    ? (index: number) => () => onImagePress(index)
    : () => undefined;

  if (images.length === 1) {
    return <Image {...images[0]} onPress={handlerFor(0)} />;
  }

  if (__DEV__) {
    const firstAspect = images[0]?.aspectRatio;
    const allUniform = images.every((i) => i.aspectRatio === firstAspect);
    if (allUniform) {
      console.warn(
        "[Mosaic] received images with identical aspectRatio " +
          `(${firstAspect}). Mosaic is for mixed shapes -- consider ` +
          "Carousel (swipeable, uniform) or a gallery grid for same-shape " +
          "sequences.",
      );
    }
  }

  // Outer-corners-only rounding: first tile rounds its top, last tile
  // rounds its bottom, everything in between is fully square. Gives the
  // stack one continuous soft outline at the top and bottom while keeping
  // internal seams sharp. The single-tile case is handled by the early
  // return above; here `images.length` is always >= 2 so first != last.
  const roundedFor = (index: number): "top" | "bottom" | false => {
    if (index === 0) return "top";
    if (index === images.length - 1) return "bottom";
    return false;
  };

  return (
    <View style={styles.stack}>
      {images.map((image, index) => (
        <Image
          key={index}
          {...image}
          onPress={handlerFor(index)}
          rounded={roundedFor(index)}
        />
      ))}
    </View>
  );
}

export default Mosaic;

const styles = StyleSheet.create({
  /**
   * Vertical-stack container. No inter-tile gap -- tiles pack flush so the
   * mosaic reads as one tall collage with a single rounded outline (top
   * corners on the first tile, bottom on the last, square in between).
   * Matches the kit's gallery / carousel rule that media variants render
   * as one continuous shape, with the corner treatment carrying the
   * "these are distinct photos" reading.
   */
  stack: {
    flexDirection: "column",
    gap: 0,
  },
});
