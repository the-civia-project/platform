/**
 * Top-of-screen masthead: brand logo on the left, eyebrow / title / subtitle
 * on the right, and an optional hint footer separated by a hairline divider.
 *
 * Sits directly on the page background -- no fill, no all-around border --
 * and is framed by four L-shaped hairline corner ticks with rounded
 * elbows (crop-mark / schematic-corner style, softened), so the panel
 * boundary reads as negative space + structural hints rather than a
 * continuous stroke. The eyebrow uses the
 * platform monospace ({@link "./Typography".monoFamily}) with a leading
 * `// ` comment marker for an annotated / developer-console accent that
 * dovetails with the schematic frame. Title and subtitle stay in the
 * Gazette body face so the surface still reads as editorial -- the ticks +
 * mono eyebrow are the "futuristic" moment, deliberately small dose, no
 * accent colours, no fill.
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Logo from "./Logo";
import { Text, monoFamily } from "./Typography";
import { useTheme } from "./use-theme";

/**
 * Content slots for {@link Hero}.
 */
export type HeroProps = {
  /**
   * Small uppercase label above the title (e.g. `"Component library"`).
   * Rendered in monospace and prefixed with `// ` so the masthead opens on
   * a comment-style annotation.
   */
  eyebrow: string;
  /** Main headline of the hero. */
  title: string;
  /** Supporting copy below the title. */
  subtitle: string;
  /**
   * Optional hint shown in the divided footer; pass `null`/`undefined` to omit it.
   */
  hint?: ReactNode;
  /**
   * Renders above the title, left-aligned (e.g. an "Optional" pill).
   */
  titleLeading?: ReactNode;
};

/**
 * Renders the kit's masthead: app logo, copy column, optional hint footer,
 * framed by four HUD-style hairline corner ticks instead of a bordered
 * panel.
 *
 * @param props - {@link HeroProps}
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  hint,
  titleLeading,
}: HeroProps) {
  const theme = useTheme();
  // Single rule colour for the framing ticks + the inner hint divider. The
  // canonical hairline token tracks under both schemes so the masthead's
  // chrome reads consistently on light and dark.
  const ruleColor = theme.borderDefault;

  return (
    <View style={styles.panel}>
      <CornerTick position="tl" color={ruleColor} />
      <CornerTick position="tr" color={ruleColor} />
      <CornerTick position="bl" color={ruleColor} />
      <CornerTick position="br" color={ruleColor} />
      <View style={styles.top}>
        <Logo size="xl" />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{`// ${eyebrow}`}</Text>
          {titleLeading != null ? (
            <View style={styles.titleBlock}>
              <View style={styles.titleLeading}>{titleLeading}</View>
              <Text style={[styles.title, styles.titleInBlock]}>{title}</Text>
            </View>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {hint != null ? (
        <View style={[styles.hintRow, { borderTopColor: ruleColor }]}>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Which corner a {@link CornerTick} anchors to. `tl` = top-left, `tr` =
 * top-right, `bl` = bottom-left, `br` = bottom-right.
 */
type CornerPosition = "tl" | "tr" | "bl" | "br";

/**
 * One of the four L-shaped HUD ticks framing the masthead. Each tick is
 * a 14px square anchored to its corner with two adjacent hairline borders
 * -- top + left for `"tl"`, top + right for `"tr"`, etc. The corner where
 * the two strokes meet sits flush with the panel corner and rounds off
 * with a {@link TICK_RADIUS}-px arc so the elbow reads as a soft schematic
 * curve rather than a 90-degree miter; the opposite open elbow extends
 * 14px inward.
 *
 * Local to this module because no other kit surface needs the pattern
 * today; promote when a second consumer appears.
 */
function CornerTick({
  position,
  color,
}: {
  position: CornerPosition;
  color: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.tick,
        TICK_ANCHOR[position],
        TICK_SIDES[position],
        { borderColor: color },
      ]}
    />
  );
}

/**
 * Per-corner absolute anchoring: which two edges of the parent panel the
 * tick aligns to. Pinned to `0` on both axes so the tick's outer corner
 * sits flush with the panel's outer corner regardless of panel padding.
 */
const TICK_ANCHOR: Record<CornerPosition, ViewStyle> = {
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
};

/**
 * Corner-radius for the elbow of each {@link CornerTick}. Sized at less
 * than half the tick's 14px side so the L still reads as two distinct
 * strokes joined by a smooth arc, rather than collapsing into a
 * quarter-circle.
 */
const TICK_RADIUS = 6;

/**
 * Per-corner border sides + matching elbow radius: which two adjacent
 * edges of the 14px tick square paint to produce the L-shape, plus the
 * {@link TICK_RADIUS} on the single corner where those two strokes meet
 * so the elbow renders as a soft arc. The other two edges stay
 * transparent so the tick reads as a crop-mark rather than a square box.
 */
const TICK_SIDES: Record<CornerPosition, ViewStyle> = {
  tl: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: TICK_RADIUS,
  },
  tr: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopRightRadius: TICK_RADIUS,
  },
  bl: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: TICK_RADIUS,
  },
  br: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomRightRadius: TICK_RADIUS,
  },
};

const styles = StyleSheet.create({
  /**
   * Outer masthead container. No fill, no border, no radius -- the four
   * {@link CornerTick}s carry the entire frame. Padding leaves enough
   * breathing room between the content and the ticks so the L-shapes
   * read as crop-marks rather than crowding the copy.
   */
  panel: {
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  tick: {
    position: "absolute",
    width: 14,
    height: 14,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  copy: {
    flex: 1,
    paddingTop: 4,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: monoFamily,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    opacity: 0.55,
    marginBottom: 8,
  },
  titleBlock: {
    gap: 10,
    marginBottom: 8,
  },
  titleLeading: {
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleInBlock: {
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    opacity: 0.78,
  },
  hintRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
  },
});
