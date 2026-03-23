/**
 * Small uppercase badge on {@link Theme.surfaceWell} — target kind pills,
 * paywall labels, disclosure categories. Static (not a pressable chip).
 */
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link StatusBadge}.
 */
export type StatusBadgeProps = {
  /** Badge label (rendered uppercase). */
  label: string;
  /** Optional leading icon (12px). */
  icon?: LucideIcon;
};

/**
 * Renders a recessed status capsule.
 */
export function StatusBadge({ label, icon: Icon }: StatusBadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.borderDefault,
          backgroundColor: theme.surfaceWell,
        },
      ]}
      accessibilityRole="text"
    >
      {Icon != null ? <Icon size={12} color={theme.fgMuted} /> : null}
      <RNText style={[styles.label, { color: theme.fgMuted }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
