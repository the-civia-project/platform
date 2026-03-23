/**
 * Icon + uppercase kind label row used atop structured post tiles
 * ("Petition", "Fact-check", "Article", …).
 */
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Typography scale for {@link KindHeader}.
 */
export type KindHeaderSize = "sm" | "md";

/**
 * Props for {@link KindHeader}.
 */
export type KindHeaderProps = {
  /** 16px Lucide icon rendered before the label. */
  icon: LucideIcon;
  /** Uppercase kind name. */
  label: string;
  /**
   * `sm` — attachment tiles (11px label). `md` — archetype headers (12px).
   * @defaultValue `"sm"`
   */
  size?: KindHeaderSize;
};

const SIZE_STYLES: Record<
  KindHeaderSize,
  { fontSize: number; letterSpacing: number }
> = {
  sm: { fontSize: 11, letterSpacing: 1 },
  md: { fontSize: 12, letterSpacing: 0.6 },
};

/**
 * Renders the kind eyebrow row.
 */
export function KindHeader({ icon: Icon, label, size = "sm" }: KindHeaderProps) {
  const theme = useTheme();
  const scale = SIZE_STYLES[size];

  return (
    <View style={styles.root}>
      <Icon size={16} color={theme.fgMuted} />
      <RNText
        style={[
          styles.label,
          scale,
          { color: theme.fgMuted },
        ]}
      >
        {label}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
