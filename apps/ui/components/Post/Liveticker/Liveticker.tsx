/**
 * Full-view append-only liveticker silhouette for dedicated routes. Renders a
 * title row, optional live / closed status chrome, and a vertical list of
 * timestamped entries -- the kit paints the shape; websocket ingestion,
 * moderation, and retention policies live upstream. Pair with
 * {@link LivetickerTeaser} on {@link "../Post".PostProps.archetype} for the
 * feed-row summary.
 */
import { Radio } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * One timestamped line in a {@link PostLiveticker}. The kit does not parse
 * {@link PostLivetickerEntry.timeLabel}; pass the string your clock source
 * already formatted for the active locale.
 */
export type PostLivetickerEntry = {
  /**
   * Stable identifier for the row. Used as the React `key` in the entry list.
   */
  id: string;
  /**
   * Time or relative label shown at the leading edge of the row ("14:32",
   * "2 min ago").
   */
  timeLabel: string;
  /** Entry body copy. Wraps freely; the kit does not collapse updates. */
  content: string;
};

/**
 * Payload shared by {@link Liveticker} and {@link LivetickerTeaser}.
 */
export type PostLiveticker = {
  /** Ticker headline shown in both teaser and full view. */
  title: string;
  /**
   * Append-only entries, oldest-first or newest-first -- the full view renders
   * in array order; call sites pick the convention that matches their feed.
   */
  entries: readonly PostLivetickerEntry[];
  /**
   * When `true`, a "Live" pulse renders in the status row. When `false` or
   * omitted and {@link PostLiveticker.closedLabel} is set, that label renders
   * instead as muted copy without the pulse.
   * @defaultValue false
   */
  live?: boolean;
  /**
   * Muted label when the ticker is no longer updating ("Closed -- 18:04",
   * "Final update"). Ignored when {@link PostLiveticker.live} is `true`.
   */
  closedLabel?: string;
};

/**
 * Props for {@link Liveticker}.
 */
export type LivetickerProps = {
  /** Liveticker payload -- title through entries. */
  liveticker: PostLiveticker;
};

/**
 * Scroll-free vertical list suitable for nesting inside a kit `Page` shell.
 *
 * @param props - {@link LivetickerProps}
 */
export default function Liveticker({ liveticker }: LivetickerProps) {
  const theme = useTheme();
  const { title, entries, live = false, closedLabel } = liveticker;

  return (
    <View style={styles.root}>
      <View style={styles.kindRow}>
        <Radio size={16} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Liveticker
        </RNText>
      </View>
      <Text style={[styles.title, { color: theme.fgEmphasis }]}>{title}</Text>
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
      <View style={[styles.entryList, { borderColor: theme.borderDefault }]}>
        {entries.map((e) => (
          <View key={e.id} style={styles.entryRow}>
            <RNText style={[styles.time, { color: theme.fgMuted }]}>
              {e.timeLabel}
            </RNText>
            <RNText style={[styles.entryBody, { color: theme.fg }]}>
              {e.content}
            </RNText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
    gap: 10,
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
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  statusRow: {
    minHeight: 22,
    justifyContent: "center",
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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  closedLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  entryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 12,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  time: {
    width: 56,
    fontSize: 13,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  entryBody: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
