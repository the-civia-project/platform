/**
 * Mock video tile: a single rounded photo with a centered play-button
 * overlay painted on top. Stands in for a real {@link "expo-av"} /
 * {@link "react-native-video"} player while the kit's video pipeline is
 * still upstream of this file -- the surrounding kit (post body
 * dispatch, composer staging, feed row layout) needs a `kind: "video"`
 * shape today, so this primitive ships the visual silhouette without
 * the playback machinery underneath.
 *
 * Treat the {@link VideoData.source} URL as the *poster* image, not the
 * video itself. When the real player lands the data shape can grow a
 * separate playback URL without breaking callers -- the poster slot is
 * a long-lived field that a streamed video has anyway.
 *
 * Defaults to the same 16:9 aspect ratio {@link "./Image".Image} uses,
 * so a feed of mixed photo/video posts keeps a consistent vertical
 * rhythm. Callers can override {@link VideoData.aspectRatio} for
 * vertically-oriented short-form video, square auto-play loops, etc.
 *
 * Sits alongside {@link "./Image".Image} as a sibling primitive rather
 * than reusing the same component with a "show play button" prop --
 * keeping the play overlay on its own component means
 * {@link "./Mosaic".Mosaic}, {@link "./Carousel".Carousel}, and the
 * gallery layouts in {@link "../Post".Post} can keep their tile types
 * narrowed to {@link "./Image".ImageData} without leaking a `video?:
 * boolean` flag through every sibling. A future "mixed photo and video
 * gallery" can compose {@link Image} and {@link Video} side-by-side
 * once that variant has a real use-case.
 *
 * `alt` is required (no optional fallback) so the kit's accessibility
 * contract is enforced at the type level: a video with no label is
 * invisible to assistive tech, and a media-only post has no body copy
 * to lean on for compensation. The play overlay itself is marked
 * `accessibilityElementsHidden` so the row reads as "<alt>. Button.
 * Plays the video." rather than reading the chrome twice.
 *
 * @example
 * ```tsx
 * // Mock video, default 16:9 ratio.
 * <Video
 *   source="https://example.com/video-poster.jpg"
 *   alt="Studio walkthrough of the new colour-tokens release"
 *   onPress={() => openPlayer()}
 * />
 * ```
 */
import { Play } from "lucide-react-native";
import { Image as RNImage, Pressable, StyleSheet, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";

/**
 * Tile-data shape -- the half of {@link VideoProps} that describes the
 * video itself. Mirrors {@link "./Image".ImageData} so callers that
 * store mixed photo/video records ({@link "../Post".PostMedia} embedded
 * in a feed row, a staged draft attachment) can map the two shapes onto
 * one storage schema with just the discriminant changing.
 */
export type VideoData = {
  /**
   * Poster image URL. Rendered as the frozen frame underneath the play
   * overlay; when the real player lands the data shape can grow a
   * separate playback URL alongside this slot without breaking callers.
   */
  source: string;
  /**
   * Screen-reader description of the video. Required so the kit's
   * accessibility contract is enforced at the type level -- a video
   * with no label is invisible to assistive tech, and a media-only
   * post can't lean on body copy to compensate when there isn't any.
   */
  alt: string;
  /**
   * Display aspect ratio (width / height). Defaults to `16/9` -- the
   * same default {@link "./Image".Image} uses, so a feed of mixed
   * photo/video posts doesn't jump in rhythm between rows. Pass
   * `9/16` for vertical short-form, `1` for square auto-loop, etc.
   * @defaultValue 16/9
   */
  aspectRatio?: number;
};

/**
 * Public props for {@link Video}.
 */
export type VideoProps = VideoData & {
  /**
   * Optional press handler. When set, the tile becomes a `Pressable`
   * with `accessibilityRole="button"`, an `accessibilityHint` of
   * `"Plays the video"`, and the kit's standard press feedback
   * (opacity dip + subtle scale-down). Typical use is to launch a
   * full-screen player. Omit for a static, non-interactive poster.
   */
  onPress?: () => void;
  /**
   * Whether (and where) to apply the kit's 16px corner radius.
   * Mirrors {@link "./Image".ImageProps.rounded} so video tiles can
   * eventually be dropped into the same vertical-stack / framed-
   * carousel layouts as photo tiles without the call site re-deriving
   * the corner contract.
   *
   * - `true` (the default) -- all four corners rounded.
   * - `false` -- no rounding. Use when the video sits inside another
   *   surface that already rounds (e.g. a future video-aware
   *   {@link "./Carousel".Carousel} frame).
   * - `"top"` -- top corners only. Mirror of {@link "./Image".Image}'s
   *   first-of-stack mosaic case for a future video-aware mosaic.
   * - `"bottom"` -- bottom corners only. Mirror of the last-of-stack
   *   mosaic case.
   *
   * @defaultValue true
   */
  rounded?: boolean | "top" | "bottom";
};

/**
 * Renders the video poster + centered play overlay. See
 * {@link VideoProps} for the data contract.
 *
 * @param props - {@link VideoProps}
 */
export function Video({
  source,
  alt,
  aspectRatio = 16 / 9,
  onPress,
  rounded = true,
}: VideoProps) {
  const radiusStyle =
    rounded === true
      ? styles.rounded
      : rounded === "top"
        ? styles.roundedTop
        : rounded === "bottom"
          ? styles.roundedBottom
          : null;
  const frame = (
    <View style={[styles.frame, { aspectRatio }, radiusStyle]}>
      <RNImage
        source={{ uri: source }}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={alt}
      />
      {/*
        Chrome is a centered scrim bubble + a Play glyph -- both purely
        decorative once the surrounding `Pressable` carries the label
        and hint. `accessibilityElementsHidden` (iOS) +
        `importantForAccessibility="no-hide-descendants"` (Android)
        together stop assistive tech from descending into the overlay
        so the row reads as one button instead of three nested nodes.
      */}
      <View
        style={styles.playOverlay}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.playBubble}>
          {/*
            White triangle on the dark scrim is the same affordance
            YouTube / Vimeo / Twitter use; pinning the colour to
            `#ffffff` (not `theme.fgInverse`) keeps the glyph legible
            on top of *any* poster, regardless of the scheme the
            surrounding kit was rendered against -- the scrim is
            theme-neutral dark on both schemes for the same reason
            the gallery `+N` overlay is.
          */}
          <Play size={28} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Plays the video"
        accessibilityLabel={alt}
        onPress={onPress}
        style={({ pressed }) => [webFocusOutlineStyle(), pressed && styles.pressed]}
      >
        {frame}
      </Pressable>
    );
  }
  return frame;
}

export default Video;

const styles = StyleSheet.create({
  /**
   * Frame the poster image lives in. `overflow: "hidden"` clips both
   * the image and the play overlay to the same rounded outline; the
   * `aspectRatio` style applied inline by {@link Video} sizes the
   * height off the parent-provided width. `width: "100%"` matches
   * {@link "./Image".Image}'s sizing contract so the two primitives
   * are drop-in equivalents inside any column-flex parent.
   */
  frame: {
    width: "100%",
    overflow: "hidden",
  },
  /**
   * Default rounded outline -- 16px on all four corners, matching
   * {@link "./Image".Image}'s default.
   */
  rounded: {
    borderRadius: 16,
  },
  /**
   * Top-corners-only outline. Mirror of
   * {@link "./Image".styles.roundedTop} for a future video-aware
   * mosaic stack's first tile.
   */
  roundedTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  /**
   * Bottom-corners-only outline. Mirror of
   * {@link "./Image".styles.roundedBottom} for a future video-aware
   * mosaic stack's last tile.
   */
  roundedBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  /**
   * Full-bleed centring layer for the play bubble. Sits on top of the
   * poster image inside {@link styles.frame}; `pointerEvents="none"`
   * on the host View lets the outer `Pressable` catch taps anywhere
   * across the frame (not just on the bubble itself).
   */
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  /**
   * Circular scrim behind the Play glyph. Pinned `rgba(0,0,0,0.55)`
   * (not a theme token) for the same reason the gallery `+N`
   * overlay's scrim is theme-neutral dark: the bubble paints over
   * arbitrary photo content, so legibility wins over scheme
   * matching. Diameter is 64px -- big enough to read clearly at
   * thumb-friendly tap targets on a feed row, small enough not to
   * dominate the poster.
   */
  playBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  /**
   * Pressed-state overlay -- mirrors {@link "./Image".styles.pressed}
   * so a video tile and a photo tile feel identical on press.
   */
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
