/**
 * Full-view decree silhouette for dedicated routes. Renders issuing body,
 * decree number, title, plain-language summary, signing authority, and a
 * labelled full-text attachment row -- the kit paints the record shape;
 * gazette publication, digital signatures, and PDF hosting live upstream.
 * Pair with {@link DecreeTeaser} on {@link "../Post".PostProps.archetype} for
 * the feed-row teaser of the same {@link PostDecree} payload.
 */
import { Gavel } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * Payload shared by {@link Decree} and {@link DecreeTeaser}. Carries the
 * metadata the teaser needs plus optional long-form lines for the detail view.
 */
export type PostDecree = {
  /** Body that issued the instrument (council, ministry, court, ...). */
  issuingBody: string;
  /** Official identifier ("Decree 142/2026", "Ordinance 12-B"). */
  decreeNumber: string;
  /** Short public title. */
  title: string;
  /**
   * Plain-language summary for citizens. Shown prominently on both teaser
   * and full view.
   */
  summary: string;
  /**
   * Label for the attached full text ("Full text (PDF, 12 pages)").
   * The kit does not render the file; wire {@link DecreeProps.onAttachmentPress}.
   * @defaultValue undefined
   */
  fullTextAttachmentLabel?: string;
  /** Authority line ("Signed: Mayor, City of Example"). */
  signingAuthority: string;
  /**
   * Optional extra paragraphs for the detail route only; ignored by the teaser.
   * @defaultValue undefined
   */
  body?: readonly string[];
};

/**
 * Props for {@link Decree}.
 */
export type DecreeProps = {
  /** Decree metadata and optional body paragraphs. */
  decree: PostDecree;
  /**
   * When set, the full-text row is pressable.
   * @defaultValue undefined
   */
  onAttachmentPress?: () => void;
};

/**
 * Scrollable long-form decree layout for a detail route. Root is a plain
 * {@link View} (no nested scroll) so the screen {@link "../Page".Page} owns
 * scrolling, matching {@link "../Article".default}.
 *
 * @param props - {@link DecreeProps}
 */
export default function Decree({ decree, onAttachmentPress }: DecreeProps) {
  const theme = useTheme();
  const paragraphs =
    decree.body !== undefined && decree.body.length > 0
      ? decree.body
      : [
          "Placeholder explanatory copy for the kit silhouette. Wire gazette paragraphs into PostDecree.body when the upstream CMS supplies them.",
        ];

  return (
    <View style={styles.root}>
      <View style={styles.kindRow}>
        <Gavel size={18} color={theme.fgMuted} />
        <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
          Decree
        </RNText>
      </View>
      <RNText style={[styles.meta, { color: theme.fgMuted }]}>
        {decree.issuingBody} · {decree.decreeNumber}
      </RNText>
      <Text style={[styles.title, { color: theme.fgEmphasis }]}>
        {decree.title}
      </Text>
      <RNText style={[styles.summary, { color: theme.fg }]}>
        {decree.summary}
      </RNText>
      {decree.fullTextAttachmentLabel !== undefined &&
      decree.fullTextAttachmentLabel !== "" ? (
        <RNText
          accessibilityRole={onAttachmentPress !== undefined ? "button" : "text"}
          onPress={onAttachmentPress}
          style={[
            styles.attachment,
            {
              color:
                onAttachmentPress !== undefined ? theme.primary : theme.fgMuted,
            },
          ]}
        >
          {decree.fullTextAttachmentLabel}
        </RNText>
      ) : null}
      <RNText style={[styles.authority, { color: theme.fgMuted }]}>
        {decree.signingAuthority}
      </RNText>
      <View style={styles.bodyBlock}>
        {paragraphs.map((p, i) => (
          <RNText
            key={i}
            style={[styles.paragraph, { color: theme.fg }]}
          >
            {p}
          </RNText>
        ))}
      </View>
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
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
  },
  attachment: {
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
  },
  authority: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  bodyBlock: {
    marginTop: 8,
    gap: 14,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});
