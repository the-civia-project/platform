/**
 * Hairline-bordered list row for structured tiles (dataset downloads,
 * fact-check evidence). Optional press with kit-standard opacity feedback.
 */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";

/**
 * Props for {@link BorderedRow}.
 */
export type BorderedRowProps = {
  /** Leading glyph or icon column. */
  leading?: ReactNode;
  /** Primary line. */
  title: string;
  /** Optional muted subtitle under the title. */
  subtitle?: string;
  /** Right column (format pills, download icon, …). */
  trailing?: ReactNode;
  /** When set, wraps the row in a pressable. */
  onPress?: () => void;
  /** Screen-reader label when pressable. */
  accessibilityLabel?: string;
};

/**
 * Renders one bordered row inside a structured tile.
 */
export function BorderedRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityLabel = title,
}: BorderedRowProps) {
  const theme = useTheme();

  const inner = (
    <View style={[styles.row, { borderColor: theme.borderHandle }]}>
      {leading}
      <View style={styles.body}>
        <RNText
          style={[styles.title, { color: theme.fgEmphasis }]}
          numberOfLines={1}
        >
          {title}
        </RNText>
        {subtitle != null ? (
          <RNText
            style={[styles.subtitle, { color: theme.fgMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </RNText>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.92,
  },
});
