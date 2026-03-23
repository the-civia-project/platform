/**
 * Pagination indicator -- a horizontal row of small dots where the active
 * one expands into a horizontal "pill" while the rest stay as small
 * circles. Reads as "the marker for the current page has a different
 * *shape*, not just a different colour", which is the strongest passive
 * signal a row of dots can give without graduating into a noisier control
 * (a sliding thumb, a numeric counter). Designed as a standalone primitive
 * so any other component that paginates through a fixed-length sequence
 * (paged sheets, onboarding flows, light-weight image previewers) can pick
 * it up without re-deriving the geometry / theme / animation handshake.
 *
 * Animation: each dot owns a single `0..1` {@link Animated.Value} that
 * interpolates *both* its width (6px circle <-> 18px pill) and its
 * background colour (`theme.fgMuted` <-> `theme.fg`) in lockstep, so the
 * shape and the colour move together as one motion rather than two
 * independent transitions. Width interpolation can't go through the native
 * driver, but with at most a handful of dots in a feed-level carousel the
 * cost is negligible at 60fps. The default easing is `Easing.out(Easing.ease)`
 * so the pill snaps to width quickly and settles softly, matching the
 * "tap & forget" feel of a paged surface.
 *
 * The dots are purely decorative -- they describe the active page of the
 * surrounding control rather than being an interactive control themselves
 * -- so the row is `accessibilityElementsHidden` and
 * `importantForAccessibility="no-hide-descendants"`. Screen readers skip
 * past it and announce only the content the paged control hosts.
 *
 * Renders nothing when `count` is `0` or `1`: a single-page indicator is
 * just visual noise, and an empty one is a layout bug. Callers don't have
 * to guard for those cases at the call site.
 *
 * @example
 * ```tsx
 * <Dots count={images.length} activeIndex={current} />
 * ```
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Public props for {@link Dots}.
 */
export type DotsProps = {
  /**
   * Total number of dots to render. Typically the length of the underlying
   * sequence (e.g. `images.length` for a carousel). Values `<= 1` short-
   * circuit to a null render.
   */
  count: number;
  /**
   * 0-based index of the dot that should read as "active" (painted in
   * `theme.fg` and expanded into a pill). Out-of-range values still
   * render -- the highlight just doesn't land on any dot, which is the
   * right behaviour during a brief transient where the consumer's index
   * hasn't caught up to a mounted dot count.
   */
  activeIndex: number;
};

/**
 * Renders a row of pagination dots with an animated pill highlight on the
 * active one.
 *
 * @param props - {@link DotsProps}
 */
export function Dots({ count, activeIndex }: DotsProps) {
  const theme = useTheme();
  if (count <= 1) return null;
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Dot
          key={index}
          active={index === activeIndex}
          activeColor={theme.fg}
          inactiveColor={theme.fgMuted}
        />
      ))}
    </View>
  );
}

export default Dots;

/** Pill width applied to the active dot (px). */
const ACTIVE_WIDTH = 18;
/** Circle diameter applied to inactive dots (px). Also the row's height. */
const INACTIVE_WIDTH = 6;
/**
 * Duration of the active <-> inactive transition (ms). 220ms sits in the
 * "feels instant but readable" sweet spot -- short enough that paging feels
 * responsive, long enough that the pill's shape change registers as motion
 * rather than a jump.
 */
const TRANSITION_MS = 220;

/**
 * Internal-only props for the per-dot animated wrapper. Lives below the
 * public {@link Dots} export because no other component in the kit ever
 * needs a single bare animated dot -- the row-of-dots indicator is the
 * unit consumers actually compose with.
 */
type DotProps = {
  /** Whether this dot represents the active page. */
  active: boolean;
  /** Background colour while active. Sourced from `theme.fg`. */
  activeColor: string;
  /** Background colour while inactive. Sourced from `theme.fgMuted`. */
  inactiveColor: string;
};

/**
 * Single animated dot. Owns one `Animated.Value` that smoothly interpolates
 * between the inactive (small circle, muted) and active (wider pill,
 * emphasised) appearances so paging always reads as a continuous motion of
 * the highlight rather than two dots flipping their state simultaneously.
 */
function Dot({ active, activeColor, inactiveColor }: DotProps) {
  // `useRef` so the Animated.Value survives re-renders without being
  // re-created. Initialised from the current `active` state so a freshly-
  // mounted active dot paints as a pill on the very first frame (no
  // "from inactive to active" animation flash on mount).
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.ease),
      // Width and colour interpolations aren't supported by the native
      // driver; with at most a handful of dots in a feed-level carousel
      // the JS-driver cost is negligible at 60fps.
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [INACTIVE_WIDTH, ACTIVE_WIDTH],
          }),
          backgroundColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [inactiveColor, activeColor],
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  /**
   * Centred horizontal cluster. `marginTop: 8` separates the dots from the
   * paged surface above; consumers that need a tighter or looser gap can
   * wrap {@link Dots} in their own spacing layer rather than threading a
   * prop through. The row recentres itself as the active dot expands /
   * contracts because `justifyContent: "center"` is symmetric -- adjacent
   * UI doesn't shift even though the row's total width changes by ~12px
   * between active states.
   */
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  /**
   * Fixed-height pill geometry shared by every dot. The `width` is
   * animated per-dot from {@link INACTIVE_WIDTH} to {@link ACTIVE_WIDTH},
   * but `borderRadius: 3` (half of the height) keeps both endpoints
   * looking right: a 6x6 box reads as a circle and an 18x6 box reads as a
   * fully-rounded pill, with every intermediate width interpolating
   * between the two without per-frame border-radius work.
   */
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
