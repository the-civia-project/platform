/**
 * Feed-row teaser for a {@link "../Post".PostArchetype} `testimony` variant.
 * Shows testimony chrome, witness capacity, date + location, and a truncated
 * statement. Wire {@link TestimonyTeaserProps.onPress} from
 * {@link "../Post".PostProps.onArchetypePress} for navigation to {@link Testimony}.
 */
import { Mic2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../../core/web-focus-outline";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";
import type { PostTestimony } from "./Testimony";

/**
 * Props for {@link TestimonyTeaser}.
 */
export type TestimonyTeaserProps = {
  /** Shared payload with {@link Testimony}. */
  testimony: PostTestimony;
  /**
   * When set, wraps the card in a {@link Pressable}.
   * @defaultValue undefined
   */
  onPress?: () => void;
};

/**
 * Archetype teaser for testimony inside {@link "../Post".default}.
 *
 * @param props - {@link TestimonyTeaserProps}
 */
export function TestimonyTeaser({ testimony, onPress }: TestimonyTeaserProps) {
  const theme = useTheme();
  const inner = (
    <>
      <View style={styles.kindRow}>
        <Mic2 size={16} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Testimony
        </RNText>
      </View>
      <RNText style={[styles.capacity, { color: theme.fgMuted }]} numberOfLines={2}>
        {testimony.witnessCapacity}
      </RNText>
      <RNText style={[styles.whenWhere, { color: theme.fgMuted }]} numberOfLines={1}>
        {testimony.eventDateLabel} · {testimony.locationLabel}
      </RNText>
      <Text style={[styles.statement, { color: theme.fg }]} numberOfLines={4}>
        {testimony.statement}
      </Text>
    </>
  );

  return onPress !== undefined ? (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        webFocusOutlineStyle(),
        {
          borderColor: theme.borderDefault,
          backgroundColor: theme.surfaceCard,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens the full testimony"
    >
      {inner}
    </Pressable>
  ) : (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.borderDefault,
          backgroundColor: theme.surfaceCard,
        },
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
    alignSelf: "stretch",
    width: "100%",
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kindLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  capacity: {
    fontSize: 13,
    lineHeight: 18,
  },
  whenWhere: {
    fontSize: 12,
    lineHeight: 16,
  },
  statement: {
    fontSize: 15,
    lineHeight: 22,
  },
});
