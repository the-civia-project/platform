/**
 * Standalone rounded-image primitive. Wraps React Native's `Image` with the
 * kit's 16px corner radius, a full-width sizing contract
 * (`width: "100%"`, sized to whatever container the caller drops it into),
 * and an optional press wrapper that gives the tile the same opacity-dip +
 * scale-down feedback the rest of the kit uses for tappable photos
 * (quote insets, gallery tiles, disclosure cards).
 *
 * Sits underneath {@link Mosaic} and {@link Carousel} -- each of those
 * components defers tile rendering to this one so a future visual change
 * (radius retune, accessibility-label policy, press-feedback animation,
 * placeholder strategy) lands everywhere at once. {@link Carousel} passes
 * `rounded={false}` because its frame already clips to a rounded
 * rectangle and a per-tile radius would visibly fight the frame's clip at
 * non-edge tiles during scroll.
 *
 * `alt` is required (no optional fallback) so the kit's accessibility
 * contract is enforced at the type level: an image with no label is
 * invisible to assistive tech, and a media-only post has no body copy to
 * lean on for compensation.
 *
 * @example
 * ```tsx
 * // Single photo, default rounding, default 16/9 aspect.
 * <Image source="https://..." alt="Sunlit rooftops" />
 *
 * // Portrait photo with a tap handler.
 * <Image
 *   source="https://..."
 *   alt="Mountain plateau"
 *   aspectRatio={4 / 5}
 *   onPress={() => openPreviewer(0)}
 * />
 * ```
 */
import { Image as RNImage, Pressable, StyleSheet } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";

/**
 * Tile-data shape -- the half of {@link ImageProps} that describes the
 * photo itself. Carved out as a named type so consumers that *store* a
 * list of photos (`gallery`, `mosaic`, ...) can type their records with a
 * single record shape, then pair each record with its own press handler at
 * render time rather than baking the handler into storage.
 */
export type ImageData = {
  /** Remote image URL. Passed straight to RN `Image` as the `uri` source. */
  source: string;
  /**
   * Screen-reader description of the image's content. Required so the kit's
   * accessibility contract is enforced at the type level -- an image with
   * no label is invisible to assistive tech, and a media-only post can't
   * lean on body copy to compensate when there isn't any.
   */
  alt: string;
  /**
   * Display aspect ratio (width / height). Defaults to `16/9` -- the safest
   * non-cropping choice for most landscape photos and the same shape used
   * by the kit's link-preview thumbnails, so a feed of mixed media doesn't
   * jump in rhythm between posts. Pass `1` for a square crop, `4/5` for a
   * portrait crop, etc.
   * @defaultValue 16/9
   */
  aspectRatio?: number;
};

/**
 * Public props for {@link Image}.
 */
export type ImageProps = ImageData & {
  /**
   * Optional press handler. When set, the image becomes a `Pressable` with
   * `accessibilityRole="button"`, an `accessibilityHint` of
   * `"Opens image preview"`, and the kit's standard press feedback (opacity
   * dip + subtle scale-down). Omit for a static, non-interactive image.
   */
  onPress?: () => void;
  /**
   * Whether (and where) to apply the kit's 16px corner radius. Accepts:
   *
   * - `true` (the default) -- all four corners rounded.
   * - `false` -- no rounding. Use when the image lives inside another
   *   surface that already rounds (e.g. {@link Carousel}'s frame): a
   *   per-tile radius and a parent-frame clip would otherwise stack into a
   *   curved-corner / square-corner mismatch at non-edge slides during
   *   scroll.
   * - `"top"` -- only the top-left and top-right corners rounded. Used by
   *   {@link Mosaic} for the first tile in a multi-image stack so the
   *   bottom edge flushes square into the next tile.
   * - `"bottom"` -- only the bottom-left and bottom-right corners rounded.
   *   Mirror of `"top"` for the last tile in a multi-image stack.
   *
   * The string literals exist because a vertical stack with outer-only
   * rounding is the kit's standard pattern for "this is one mosaic with a
   * soft outer outline"; encoding `"top"` / `"bottom"` keeps the call site
   * declarative (`rounded="top"` reads like "round the top") rather than
   * forcing callers to compose four `borderTop*Radius` style overrides.
   * @defaultValue true
   */
  rounded?: boolean | "top" | "bottom";
};

/**
 * Renders a single rounded image with optional press feedback.
 *
 * @param props - {@link ImageProps}
 */
export function Image({
  source,
  alt,
  aspectRatio = 16 / 9,
  onPress,
  rounded = true,
}: ImageProps) {
  const radiusStyle =
    rounded === true
      ? styles.rounded
      : rounded === "top"
        ? styles.roundedTop
        : rounded === "bottom"
          ? styles.roundedBottom
          : null;
  const img = (
    <RNImage
      source={{ uri: source }}
      style={[styles.image, { aspectRatio }, radiusStyle]}
      accessibilityLabel={alt}
    />
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens image preview"
        accessibilityLabel={alt}
        onPress={onPress}
        style={({ pressed }) => [webFocusOutlineStyle(), pressed && styles.pressed]}
      >
        {img}
      </Pressable>
    );
  }
  return img;
}

export default Image;

const styles = StyleSheet.create({
  /**
   * Base sizing for the image. Always claims the full inline width of its
   * container; the aspect-ratio style applied on top determines the
   * matching height. Means the same component sizes correctly inside a
   * post body (`width: "100%"` chain), inside a sized container like
   * {@link Carousel}'s tile (`width: <measured>` parent), or inside any
   * other column-flex parent that hasn't otherwise constrained its
   * children's width.
   */
  image: {
    width: "100%",
  },
  /**
   * Kit-standard 16px radius applied when {@link ImageProps.rounded} is
   * `true` (the default). Kept as a separate style rather than always-on so
   * {@link Carousel} can opt out cleanly via `rounded={false}` without
   * spreading a `null` border-radius override into a list.
   */
  rounded: {
    borderRadius: 16,
  },
  /**
   * Top-corners-only radius applied when {@link ImageProps.rounded} is
   * `"top"`. The bottom edge stays square so the tile flushes cleanly
   * against the next image in a vertical stack -- {@link Mosaic} uses this
   * for the first tile in a multi-image mosaic.
   */
  roundedTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  /**
   * Bottom-corners-only radius applied when {@link ImageProps.rounded} is
   * `"bottom"`. Mirror of {@link styles.roundedTop} for the last tile in a
   * multi-image mosaic stack.
   */
  roundedBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  /**
   * Press feedback for the optional `Pressable` wrapper -- mirrors the
   * `DisclosureCard` / `EmbeddedPostInset` pattern (opacity dip + a subtle
   * scale-down) so every tappable surface in the kit feels the same on
   * press.
   */
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
