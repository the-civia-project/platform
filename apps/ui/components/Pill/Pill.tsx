/**
 * Compact capsule label: pressable selection chips (`ghost` / `primary`) or a static
 * `muted` badge (mono uppercase). Action pills share shell metrics with
 * {@link "../Button".Button}; use {@link "../SelectablePillGroup"} for controlled
 * multi-select rows.
 */
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { DISABLED_OPACITY } from "../Button/surface";
import { monoFamily } from "../Typography";
import {
  PILL_ACTION_BORDER_RADIUS_PX,
  PILL_ACTION_LABEL_FONT_SIZE_PX,
  PILL_ACTION_LABEL_LINE_HEIGHT_PX,
  PILL_ACTION_PADDING_HORIZONTAL_PX,
  PILL_ACTION_PADDING_VERTICAL_PX,
  PILL_MUTED_BORDER_RADIUS_PX,
  PILL_MUTED_LABEL_FONT_SIZE_PX,
  PILL_MUTED_LABEL_LETTER_SPACING_PX,
  PILL_MUTED_PADDING_HORIZONTAL_PX,
  PILL_MUTED_PADDING_VERTICAL_PX,
} from "./metrics";
import {
  usePillActionSurface,
  usePillMutedSurface,
  type PillVariant,
} from "./surface";

/**
 * Props for {@link Pill}.
 */
export type PillProps = {
  /** Label rendered inside the capsule. */
  children: string;
  /**
   * Visual style. When `onPress` is set and `selected` is provided, `selected`
   * drives `primary` vs `ghost` and overrides this prop.
   * @defaultValue `"muted"` without `onPress`, `"ghost"` when pressable
   */
  variant?: PillVariant;
  /**
   * Selection state for pressable pills — maps to `primary` when true and `ghost`
   * when false. Ignored when `onPress` is omitted.
   */
  selected?: boolean;
  /** When set, the pill is pressable with `accessibilityRole="button"`. */
  onPress?: () => void;
  /**
   * When true, dims the pill and ignores presses.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Screen-reader label when it differs from visible copy.
   * @defaultValue `children`
   */
  accessibilityLabel?: string;
};

function resolveEffectiveVariant({
  variant,
  selected,
  onPress,
}: Pick<PillProps, "variant" | "selected" | "onPress">): PillVariant {
  if (onPress != null && selected !== undefined) {
    return selected ? "primary" : "ghost";
  }
  if (variant != null) {
    return variant;
  }
  return onPress != null ? "ghost" : "muted";
}

/**
 * Renders a compact pill label — static badge or pressable chip.
 */
export default function Pill({
  children,
  variant,
  selected,
  onPress,
  disabled = false,
  accessibilityLabel = children,
}: PillProps) {
  const effectiveVariant = resolveEffectiveVariant({
    variant,
    selected,
    onPress,
  });
  const mutedSurface = usePillMutedSurface();
  const ghostSurface = usePillActionSurface("ghost");
  const primarySurface = usePillActionSurface("primary");
  const isPressable = onPress != null;
  const isMuted = effectiveVariant === "muted";

  const actionSurface =
    effectiveVariant === "primary" ? primarySurface : ghostSurface;
  const surface = isMuted ? mutedSurface : actionSurface;

  const shellStyle = isMuted ? styles.mutedShell : styles.actionShell;
  const labelStyle = isMuted ? styles.mutedLabel : styles.actionLabel;

  const content = (
    <Text
      style={[
        labelStyle,
        Platform.OS === "android" && !isMuted && styles.actionLabelAndroid,
        {
          color: surface.color,
          textDecorationLine: isMuted
            ? "none"
            : (actionSurface.textDecorationLine ?? "none"),
        },
      ]}
    >
      {children}
    </Text>
  );

  if (!isPressable) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        style={[
          shellStyle,
          {
            backgroundColor: surface.backgroundColor,
            borderWidth: surface.borderWidth,
            borderColor: surface.borderColor,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: selected ?? false }}
      accessibilityLabel={accessibilityLabel}
      style={[
        shellStyle,
        webFocusOutlineStyle(),
        {
          backgroundColor: surface.backgroundColor,
          borderWidth: surface.borderWidth,
          borderColor: surface.borderColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.85}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionShell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: PILL_ACTION_BORDER_RADIUS_PX,
    paddingHorizontal: PILL_ACTION_PADDING_HORIZONTAL_PX,
    paddingVertical: PILL_ACTION_PADDING_VERTICAL_PX,
  },
  mutedShell: {
    alignSelf: "flex-start",
    borderRadius: PILL_MUTED_BORDER_RADIUS_PX,
    paddingHorizontal: PILL_MUTED_PADDING_HORIZONTAL_PX,
    paddingVertical: PILL_MUTED_PADDING_VERTICAL_PX,
  },
  actionLabel: {
    fontSize: PILL_ACTION_LABEL_FONT_SIZE_PX,
    lineHeight: PILL_ACTION_LABEL_LINE_HEIGHT_PX,
    textAlign: "center",
  },
  actionLabelAndroid: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  mutedLabel: {
    fontFamily: monoFamily,
    fontSize: PILL_MUTED_LABEL_FONT_SIZE_PX,
    letterSpacing: PILL_MUTED_LABEL_LETTER_SPACING_PX,
    textTransform: "uppercase",
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});
