/**
 * Horizontal swipeable single-tile-at-a-time view. Lays out the photos
 * inside a {@link "react-native".ScrollView} with `pagingEnabled`, so a
 * left/right swipe on touch surfaces snaps to the next tile. Every tile
 * shares {@link CarouselProps.aspectRatio} so the frame's height is stable
 * across slides; {@link Dots} below the frame tracks the active slide.
 *
 * Use when the post is a *sequence* (multi-angle shoot, before/after,
 * photo series) and the photos are deliberately uniform in shape. Reach
 * for {@link Mosaic} when the images vary in aspect instead.
 *
 * The "uniform shape" contract is encoded at the type level:
 * {@link CarouselImage} has no per-tile `aspectRatio` field, so the shared
 * shape lives once on {@link CarouselProps.aspectRatio}. Callers literally
 * can't disagree about the shape from one slide to the next.
 *
 * **Cross-platform behaviour:**
 *
 * - Active-page tracking is driven by a throttled `onScroll` handler that
 *   rounds the scroll offset against the measured container width. We use
 *   `onScroll` rather than `onMomentumScrollEnd` because RN-Web only fires
 *   the latter when there's an actual momentum animation -- mouse wheel,
 *   trackpad, scrollbar drag, and CSS scroll-snap all settle without
 *   momentum, so a "momentum end"-driven dot would stay stuck at zero on
 *   every desktop scroll. `onScroll` fires throughout drag, fling, wheel,
 *   scroll-snap, *and* programmatic `scrollTo` (from a chevron press)
 *   uniformly, and on native the dots also flip mid-swipe which feels
 *   snappier than waiting for momentum to settle.
 * - On web every tile picks up `scroll-snap-stop: always` so any user
 *   input (wheel, trackpad fling, scrollbar drag, touch swipe) lands on
 *   the very next tile rather than skipping past multiple snap points in
 *   a single gesture. RN-Web's `pagingEnabled` only sets
 *   `scroll-snap-type: x mandatory`, which guarantees the *final* position
 *   is a snap point but lets a fast gesture pass over intermediate ones;
 *   stacking `scroll-snap-stop: always` on top of that closes the gap so
 *   the carousel matches native's one-page-per-gesture behaviour. The
 *   property is plumbed through {@link tileWebSnapStop} (a module-level
 *   cast) because RN's `ViewStyle` type doesn't know about web-only CSS.
 *   Native ignores the prop entirely -- it relies on `pagingEnabled` for
 *   its own one-tile snap.
 * - On desktop web only ({@link useFormFactor} returns `"web"`) the
 *   carousel also renders a pair of chevron buttons overlaying the left
 *   and right edges of the frame. Desktop web users come from a
 *   click-driven mental model and don't reliably try to swipe media in
 *   a feed, so a visible "this thing has more slides" affordance is
 *   essential there. The chevrons drive
 *   {@link "react-native".ScrollView.scrollTo} programmatically via a ref,
 *   advancing the active page by one and hiding themselves at the
 *   endpoints (no left chevron at index 0, no right at the last slide).
 *   On native (`"mobile"`) *and* on web-mobile (`"web-mobile"`) the
 *   chevrons are omitted -- both contexts have a first-class touch
 *   gesture, and a tap target stacked on top of swipe would just be
 *   redundant clutter at the phone-sized viewport.
 *
 * @example
 * ```tsx
 * <Carousel
 *   images={[
 *     { source: "https://...", alt: "Slide 1" },
 *     { source: "https://...", alt: "Slide 2" },
 *     { source: "https://...", alt: "Slide 3" },
 *   ]}
 *   aspectRatio={1}
 *   onImagePress={(index) => openPreviewer(index)}
 * />
 * ```
 */
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { IconButton } from "../Button";
import { useFormFactor } from "../use-form-factor";
import { Dots } from "./Dots";
import { Image } from "./Image";

/**
 * Tile-data shape for {@link Carousel}. Identical to {@link ImageData}
 * minus the per-image `aspectRatio` -- carousel tiles are uniform by
 * definition, with the shared aspect ratio set once on
 * {@link CarouselProps.aspectRatio}. Encoding "uniform shape" as the
 * absence of a per-tile knob makes the rule a compile-time invariant
 * rather than a runtime convention. Use {@link MosaicImage} (and
 * {@link Mosaic}) instead when you want each photo to render at its own
 * shape.
 */
export type CarouselImage = {
  /** Remote image URL. Passed straight to RN `Image` as the `uri` source. */
  source: string;
  /**
   * Screen-reader description of the image's content. Same accessibility
   * contract as {@link ImageData.alt}: required so assistive tech always
   * has a label to read as the user swipes through the carousel.
   */
  alt: string;
};

/**
 * Public props for {@link Carousel}.
 */
export type CarouselProps = {
  /**
   * Photos in display order. The carousel pages through them
   * one-at-a-time; each tile is sized to the frame's full width. A single-
   * image carousel renders as a single tile with no dots and no chevrons
   * (degenerate but valid -- the component handles it without complaint
   * so a list-driven caller doesn't have to special-case "exactly one").
   */
  images: CarouselImage[];
  /**
   * Uniform aspect ratio (width / height) applied to every tile in the
   * carousel. Defaults to `1` (square) -- the Instagram-standard carousel
   * shape. Pass `4/5` for a Twitter-style portrait carousel or any other
   * ratio that suits the sequence.
   * @defaultValue 1
   */
  aspectRatio?: number;
  /**
   * Optional press handler invoked with the 0-based index of the tapped
   * tile. The active tile receives the press; swipes don't fire this
   * handler -- they update the carousel's internal active-page state
   * silently. Wire to your full-screen previewer so it opens at the
   * matching slide.
   */
  onImagePress?: (index: number) => void;
};

/**
 * Renders a horizontal paged carousel of uniformly-shaped images, with
 * pagination dots underneath and (on desktop web) chevron overlays.
 *
 * @param props - {@link CarouselProps}
 */
export function Carousel({
  images,
  aspectRatio = 1,
  onImagePress,
}: CarouselProps) {
  const formFactor = useFormFactor();
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (images.length === 0) return null;

  const handlerFor = onImagePress
    ? (index: number) => () => onImagePress(index)
    : () => undefined;

  // Driven from `onScroll` rather than `onMomentumScrollEnd` -- see the
  // file-header for the cross-platform rationale. React bails out of
  // `setState` when the value hasn't changed, so the per-frame cost is
  // just the `Math.round`.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  // Clamping inside the helper means callers can pass `activeIndex - 1` /
  // `+ 1` without worrying about the endpoints; the chevrons also rely on
  // the clamp to stay no-ops if they're somehow tapped past the boundary
  // (e.g. via keyboard focus + Enter on a hidden button during a rapid
  // resize).
  const goToSlide = (target: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, target));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setActiveIndex(clamped);
  };

  // Chevrons are a *desktop-web* affordance: only `formFactor === "web"`
  // gets them, so the "more slides this way" affordance stays
  // discoverable for users whose mental model is click-driven. Both
  // `"mobile"` (native) and `"web-mobile"` (phone-sized browser viewport)
  // are touch-first; a tap target stacked on top of a first-class swipe
  // gesture would just be redundant clutter at the phone size. The width
  // gate handles the first layout pass (no point showing chevrons before
  // we know where to scroll to); the length gate suppresses them in the
  // degenerate single-image case where there's nowhere to go.
  const showChevrons =
    formFactor === "web" && width > 0 && images.length > 1;
  const showPrevChevron = showChevrons && activeIndex > 0;
  const showNextChevron = showChevrons && activeIndex < images.length - 1;

  return (
    <View>
      <View
        style={[styles.frame, { aspectRatio }]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {/*
          The ScrollView only renders once the frame has been measured so each
          child can be sized to the container width up-front. Without that,
          the first frame paints with `width: 0` tiles and `pagingEnabled`
          snaps erratically until the second layout pass. The one-frame skip
          is imperceptible to users.
        */}
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            // 16ms ~= 60fps -- the native threshold for dropping scroll
            // events without losing perceptible smoothness. RN-Web ignores
            // this prop (the browser already throttles its own scroll
            // events), so the same value is fine cross-platform.
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              // Each tile is a fixed-width wrapper around the standalone
              // {@link Image}. The wrapper's `width: <measured>` pins the
              // tile to the carousel frame; `Image` (with `rounded={false}`
              // because the frame already clips) fills the wrapper via its
              // own `width: "100%"` + the carousel-level `aspectRatio`. RN
              // `Image`'s default `cover` resize mode crops the source to
              // fit so any aspect mismatch with the photo's intrinsic
              // dimensions crops symmetrically rather than letterboxing.
              // On web the wrapper also picks up `scroll-snap-stop: always`
              // (see {@link tileWebSnapStop}) so a fast wheel / trackpad /
              // touch swipe lands on the very next tile rather than
              // skipping past multiple snap points in one gesture.
              <View key={index} style={[{ width }, tileWebSnapStop]}>
                <Image
                  source={image.source}
                  alt={image.alt}
                  aspectRatio={aspectRatio}
                  onPress={handlerFor(index)}
                  rounded={false}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
        {showPrevChevron ? (
          <View style={[styles.chevron, styles.chevronLeft]}>
            <IconButton
              icon={ChevronLeft}
              size="sm"
              variant="inverted"
              shape="round"
              onPress={() => goToSlide(activeIndex - 1)}
              accessibilityLabel="Previous image"
            />
          </View>
        ) : null}
        {showNextChevron ? (
          <View style={[styles.chevron, styles.chevronRight]}>
            <IconButton
              icon={ChevronRight}
              size="sm"
              variant="inverted"
              shape="round"
              onPress={() => goToSlide(activeIndex + 1)}
              accessibilityLabel="Next image"
            />
          </View>
        ) : null}
      </View>
      <Dots count={images.length} activeIndex={activeIndex} />
    </View>
  );
}

export default Carousel;

/**
 * Per-tile style applied on web only. Sets the web-only CSS property
 * `scroll-snap-stop: always`, which tells the browser its CSS scroll-snap
 * engine must not "pass over" any snap position during a single scroll
 * gesture -- a fast wheel tick, trackpad fling, or touch swipe lands on
 * the very next tile rather than skipping past multiple snap points.
 *
 * Why this lives outside {@link styles} as a module-level cast: RN's
 * {@link ViewStyle} type has no concept of `scrollSnapStop` (it's a
 * web-only CSS property), so it can't go through `StyleSheet.create`
 * without the cast. The constant is built once at module load so the
 * tile map below doesn't allocate a fresh `{ scrollSnapStop: ... }`
 * object on every render, and is `undefined` on native so the style
 * array degrades to plain `[{ width }]` without paying for an extra
 * style merge.
 *
 * Browser support: Chrome 75+, Firefox 103+, Safari 15+ -- every browser
 * the kit ships against today. Older browsers fall back to the default
 * `normal` behaviour (skipping allowed), which is exactly what we had
 * before this change.
 */
const tileWebSnapStop: StyleProp<ViewStyle> =
  Platform.OS === "web"
    ? ({ scrollSnapStop: "always" } as unknown as ViewStyle)
    : undefined;

const styles = StyleSheet.create({
  /**
   * Outer frame around the swipeable area. `width: "100%"` ties the frame
   * to the parent's width contract; `borderRadius: 16` rounds the visible
   * box; `overflow: "hidden"` clips the inner `ScrollView`'s paging tiles
   * to those rounded corners. The aspect-ratio style is composed in
   * inline at the call site from {@link CarouselProps.aspectRatio} so the
   * frame's height comes out consistent across slides.
   */
  frame: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  /**
   * Shared positioning for the desktop-web chevron buttons. Vertically
   * centred on the carousel frame via `top: 50%` + a negative top margin
   * of half the `IconButton size="sm"` (32px) box height. The container is
   * the carousel frame (`overflow: "hidden"` + `position: "relative"`
   * default for {@link View}), so the chevron sits *inside* the rounded
   * frame rather than escaping into the surrounding layout. Side offsets
   * live on the direction-specific {@link styles.chevronLeft} /
   * {@link styles.chevronRight}.
   */
  chevron: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
  },
  /**
   * Left-edge offset for the previous-slide chevron. 8px matches the
   * common-sense breathing room used elsewhere in the kit's overlays;
   * keeps the chip clear of the rounded frame's curvature without pushing
   * it into the middle of the photo.
   */
  chevronLeft: {
    left: 8,
  },
  /** Mirror of {@link styles.chevronLeft} for the next-slide chevron. */
  chevronRight: {
    right: 8,
  },
});
