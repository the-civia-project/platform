/**
 * Horizontal progress track used on engagement tiles (petitions, fundraisers).
 * Fill width is driven by `value / max`, clamped to 100%.
 */
import { StyleSheet, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link ProgressBar}.
 */
export type ProgressBarProps = {
  /** Current progress (e.g. signatures collected). */
  value: number;
  /**
   * Target progress (e.g. signature goal).
   * @defaultValue 1
   */
  max?: number;
};

/**
 * Renders a 6px rounded progress track with a primary fill.
 */
export function ProgressBar({ value, max = 1 }: ProgressBarProps) {
  const theme = useTheme();
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <View
      style={[styles.track, { backgroundColor: theme.surfaceWell }]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(ratio * 100),
      }}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: theme.primary, width: `${ratio * 100}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
