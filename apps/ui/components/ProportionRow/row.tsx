/**
 * Bordered row with an absolute proportion fill (Poll options, vote tallies).
 * Optional press target with check affordance when selected.
 */
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";

/**
 * Props for {@link ProportionRow}.
 */
export type ProportionRowProps = {
  /** Primary label on the left. */
  label: string;
  /** Fill ratio from 0 to 1 (clamped). */
  ratio: number;
  /** Right-edge meta (`42%`, `1,024 · 38%`, …). */
  trailing?: string;
  /**
   * Highlights the row with primary tint + optional check glyph.
   * @defaultValue false
   */
  selected?: boolean;
  /** When set, wraps the row in a pressable. */
  onPress?: () => void;
  /**
   * Max lines for the label.
   * @defaultValue 2
   */
  labelLines?: 1 | 2;
  /** Screen-reader label when pressable. */
  accessibilityLabel?: string;
  /** Screen-reader hint when pressable. */
  accessibilityHint?: string;
};

/**
 * Renders one proportion-backed row.
 */
export function ProportionRow({
  label,
  ratio,
  trailing,
  selected = false,
  onPress,
  labelLines = 2,
  accessibilityLabel = label,
  accessibilityHint,
}: ProportionRowProps) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const barColor = selected ? `${theme.primary}26` : theme.surfaceWell;
  const labelColor = selected ? theme.primary : theme.fgEmphasis;

  const inner = (
    <View style={[styles.row, { borderColor: theme.borderHandle }]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: barColor, width: `${clamped * 100}%` },
        ]}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.labelStack}>
          {selected ? <Check size={14} color={theme.primary} /> : null}
          <RNText
            style={[styles.label, { color: labelColor }]}
            numberOfLines={labelLines}
          >
            {label}
          </RNText>
        </View>
        {trailing != null ? (
          <RNText
            style={[styles.trailing, { color: theme.fgMuted }]}
            numberOfLines={1}
          >
            {trailing}
          </RNText>
        ) : null}
      </View>
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [webFocusOutlineStyle(), pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  row: {
    position: "relative",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minHeight: 36,
  },
  bar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  labelStack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  trailing: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
