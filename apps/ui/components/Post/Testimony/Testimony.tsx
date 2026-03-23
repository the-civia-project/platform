/**
 * Full-view testimony silhouette for dedicated routes. Renders witness
 * capacity, event date and location, the full statement, and optional cited
 * evidence label -- the kit paints the record; oath administration and
 * evidence chain-of-custody live upstream. Pair with {@link TestimonyTeaser}
 * on {@link "../Post".PostProps.archetype} for the feed-row teaser of the same
 * {@link PostTestimony} payload.
 */
import { Mic2 } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * Payload shared by {@link Testimony} and {@link TestimonyTeaser}.
 */
export type PostTestimony = {
  /** Capacity in which the witness speaks ("as expert witness", "as resident"). */
  witnessCapacity: string;
  /** Human-readable event date ("12 June 2026"). */
  eventDateLabel: string;
  /** Venue or jurisdiction line. */
  locationLabel: string;
  /** Statement as published. */
  statement: string;
  /**
   * Optional one-line pointer to cited material ("Exhibit A: traffic study").
   * @defaultValue undefined
   */
  citedEvidenceLabel?: string;
  /**
   * Optional follow-up paragraphs for the detail route; teaser uses
   * {@link PostTestimony.statement} only.
   * @defaultValue undefined
   */
  body?: readonly string[];
};

/**
 * Props for {@link Testimony}.
 */
export type TestimonyProps = {
  /** Testimony payload. */
  testimony: PostTestimony;
};

/**
 * Detail-route testimony layout. Root is a plain {@link View} so the screen
 * shell owns scrolling.
 *
 * @param props - {@link TestimonyProps}
 */
export default function Testimony({ testimony }: TestimonyProps) {
  const theme = useTheme();
  const extra =
    testimony.body !== undefined && testimony.body.length > 0
      ? testimony.body
      : [];

  return (
    <View style={styles.root}>
      <View style={styles.kindRow}>
        <Mic2 size={18} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Testimony
        </RNText>
      </View>
      <RNText style={[styles.capacity, { color: theme.fgMuted }]}>
        {testimony.witnessCapacity}
      </RNText>
      <RNText style={[styles.whenWhere, { color: theme.fgMuted }]}>
        {testimony.eventDateLabel} · {testimony.locationLabel}
      </RNText>
      <Text style={[styles.statement, { color: theme.fg }]}>
        {testimony.statement}
      </Text>
      {testimony.citedEvidenceLabel !== undefined &&
      testimony.citedEvidenceLabel !== "" ? (
        <RNText style={[styles.evidence, { color: theme.fgEmphasis }]}>
          {testimony.citedEvidenceLabel}
        </RNText>
      ) : null}
      {extra.length > 0 ? (
        <View style={styles.bodyBlock}>
          {extra.map((p, i) => (
            <RNText
              key={i}
              style={[styles.paragraph, { color: theme.fg }]}
            >
              {p}
            </RNText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignSelf: "stretch",
    gap: 10,
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kindLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  capacity: {
    fontSize: 13,
    lineHeight: 18,
  },
  whenWhere: {
    fontSize: 13,
    lineHeight: 18,
  },
  statement: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  evidence: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyBlock: {
    marginTop: 4,
    gap: 14,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});
