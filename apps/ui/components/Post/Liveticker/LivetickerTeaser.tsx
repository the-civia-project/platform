/**
 * Feed-row teaser for a {@link "../Post".PostArchetype} `liveticker` variant.
 * Surfaces the ticker title, the latest entry (last element of
 * {@link PostLiveticker.entries}), optional live pulse, and a hairline card
 * frame matching {@link "./Article".ArticleTeaser}'s density.
 */
import { Radio } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../../core/web-focus-outline";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";
import type { PostLiveticker } from "./Liveticker";

/**
 * Props for {@link LivetickerTeaser}.
 */
export type LivetickerTeaserProps = {
  /** Shared payload with {@link Liveticker}. */
  liveticker: PostLiveticker;
  /**
   * When set, the teaser wraps in a {@link Pressable} with opacity feedback.
   */
  onPress?: () => void;
};

/**
 * Archetype teaser for the liveticker shape inside {@link "../Post".default}.
 *
 * @param props - {@link LivetickerTeaserProps}
 */
export function LivetickerTeaser({ liveticker, onPress }: LivetickerTeaserProps) {
  const theme = useTheme();
  const { title, entries, live = false, closedLabel } = liveticker;
  const latest = entries.length > 0 ? entries[entries.length - 1] : undefined;

  const inner = (
    <>
      <View style={styles.kindRow}>
        <Radio size={16} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Liveticker
        </RNText>
      </View>
      <Text style={[styles.title, { color: theme.fgEmphasis }]}>{title}</Text>
      {latest !== undefined ? (
        <View style={styles.latestRow}>
          <RNText style={[styles.time, { color: theme.fgMuted }]}>
            {latest.timeLabel}
          </RNText>
          <RNText
            style={[styles.latestBody, { color: theme.fg }]}
            numberOfLines={3}
          >
            {latest.content}
          </RNText>
        </View>
      ) : (
        <RNText style={[styles.empty, { color: theme.fgMuted }]}>
          No entries yet.
        </RNText>
      )}
      <View style={styles.statusRow}>
        {live ? (
          <View style={styles.liveWrap}>
            <View style={[styles.liveDot, { backgroundColor: theme.danger }]} />
            <RNText style={[styles.liveLabel, { color: theme.danger }]}>
              Live
            </RNText>
          </View>
        ) : closedLabel !== undefined && closedLabel !== "" ? (
          <RNText style={[styles.closedLabel, { color: theme.fgMuted }]}>
            {closedLabel}
          </RNText>
        ) : null}
      </View>
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
      accessibilityHint="Opens the full liveticker"
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
    gap: 8,
    alignSelf: "stretch",
    width: "100%",
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  latestRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  time: {
    width: 48,
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  latestBody: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    minHeight: 20,
  },
  liveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  closedLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
