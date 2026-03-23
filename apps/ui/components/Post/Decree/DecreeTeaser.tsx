/**
 * Feed-row teaser for a {@link "../Post".PostArchetype} `decree` variant.
 * Renders a hairline-bordered card with decree chrome, issuing body + number,
 * title, and a truncated summary -- wire {@link DecreeTeaserProps.onPress} from
 * {@link "../Post".PostProps.onArchetypePress} to open the full {@link Decree} route.
 */
import { Gavel } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../../core/web-focus-outline";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";
import type { PostDecree } from "./Decree";

/**
 * Props for {@link DecreeTeaser}.
 */
export type DecreeTeaserProps = {
  /** Shared payload with {@link Decree}; {@link PostDecree.body} is ignored here. */
  decree: PostDecree;
  /**
   * When set, the teaser wraps in a {@link Pressable} with opacity feedback.
   * @defaultValue undefined
   */
  onPress?: () => void;
};

/**
 * Archetype teaser card for the decree shape inside {@link "../Post".default}.
 *
 * @param props - {@link DecreeTeaserProps}
 */
export function DecreeTeaser({ decree, onPress }: DecreeTeaserProps) {
  const theme = useTheme();
  const inner = (
    <>
      <View style={styles.kindRow}>
        <Gavel size={16} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Decree
        </RNText>
      </View>
      <RNText style={[styles.meta, { color: theme.fgMuted }]} numberOfLines={1}>
        {decree.issuingBody} · {decree.decreeNumber}
      </RNText>
      <Text style={[styles.title, { color: theme.fgEmphasis }]}>
        {decree.title}
      </Text>
      <RNText style={[styles.summary, { color: theme.fgMuted }]} numberOfLines={3}>
        {decree.summary}
      </RNText>
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
      accessibilityHint="Opens the full decree"
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
  meta: {
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
});
