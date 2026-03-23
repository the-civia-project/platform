/**
 * Visual silhouette of a petition attachment. Renders the ask
 * (title + supporting paragraph), a signature-progress bar, and a
 * footer row with the running tally + an optional deadline + an
 * optional "Sign" / "Signed" affordance. **Does not run a signature
 * pipeline** -- the kit primitive paints the shape; real signature
 * records (identity-bound, deduped, exportable as a legal artefact),
 * deadline enforcement, and public-counter aggregation live upstream
 * of this file, same precedent {@link "../../Media".Video} /
 * {@link "../Poll".Poll} / {@link "../Event".Event} use.
 *
 * The component is **read-only by default**: when
 * {@link PetitionProps.onSignPress} is omitted there is no button.
 * When the handler is wired *and* {@link PostPetition.viewerSigned}
 * is `false` (or unset), a "Sign" button appears; when the viewer
 * has already signed (`viewerSigned: true`), the button reads
 * "Signed" in the kit's primary accent and is inert -- the kit
 * doesn't fire the handler in that state, because re-signing a
 * petition is a meaningless operation (the upstream pipeline keys
 * on identity, not on tap count).
 *
 * @example
 * ```tsx
 * <Petition
 *   title="Restore the night bus along the Route 22 corridor"
 *   ask="The 22 used to run through 1am; service was cut last spring. We're asking the council to restore the evening shift."
 *   signatureCount={1842}
 *   goal={2500}
 *   deadlineLabel="Open until July 1"
 *   onSignPress={() => console.log("Sign")}
 * />
 * ```
 */
import { PenLine, Users } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import Button from "../../Button";
import { ExcerptText } from "../../ExcerptText";
import { KindHeader } from "../../KindHeader";
import { ProgressBar } from "../../ProgressBar";
import { StructuredTile } from "../../StructuredTile";
import { TileFooter } from "../../TileFooter";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * Tile-data shape -- the half of {@link PetitionProps} that describes
 * the petition itself. Carved out as a named type so consumers that
 * *store* petition attachments can type their records with a single
 * shape and pair each record with its own press handler at render
 * time.
 *
 * Pairs 1:1 with {@link "../Post".PetitionMedia.petition}.
 */
export type PostPetition = {
  /**
   * Headline ask. The petition's primary subject; rendered in the
   * kit's emphasised body weight above the supporting paragraph.
   */
  title: string;
  /**
   * Optional supporting paragraph. Fills out the context the title
   * can't carry on its own ("background", "why now", "what changes
   * if this passes"). Rendered as a 3-line muted paragraph under the
   * title; pass `undefined` to render just the title-and-progress
   * shape.
   */
  ask?: string;
  /**
   * Running tally of signatures. Drives the progress-bar fill (when
   * {@link goal} is set) and the count line in the footer. Pass `0`
   * for unstarted petitions -- the kit renders "0 signatures"
   * cleanly without dividing by zero.
   */
  signatureCount: number;
  /**
   * Optional target. When set the kit renders a hairline progress
   * bar filled to `min(signatureCount / goal, 1)` and the footer
   * reads `${signatureCount} of ${goal} signatures`. When omitted
   * the bar is hidden and the footer reads the count alone -- the
   * shape petitions without a formal target take.
   */
  goal?: number;
  /**
   * Optional human-readable deadline ("Open until July 1", "Closes
   * in 12 days"). Rendered next to the count in the footer.
   * Formatting / relative-time math / timezone display are the
   * caller's call -- the kit doesn't parse the string.
   */
  deadlineLabel?: string;
  /**
   * Whether the *viewer* has already signed. When `true` the Sign
   * button (if rendered) reads "Signed" in the kit's primary accent
   * and is inert (the kit doesn't fire the handler in this state).
   * When `false` (or omitted) the button reads "Sign" and presses
   * fire normally. The upstream pipeline owns the "one signature
   * per identity" invariant; the kit just paints the state.
   * @defaultValue false
   */
  viewerSigned?: boolean;
};

/**
 * Public props for {@link Petition}.
 */
export type PetitionProps = PostPetition & {
  /**
   * Optional press handler. Fires when the viewer taps the Sign
   * button -- only when {@link PostPetition.viewerSigned} is unset
   * or `false`. When omitted no button is rendered; the tile reads
   * as a read-only record of the petition's state.
   */
  onSignPress?: () => void;
};

/**
 * Renders the petition silhouette described in the file header.
 *
 * @param props - {@link PetitionProps}
 */
export function Petition({
  title,
  ask,
  signatureCount,
  goal,
  deadlineLabel,
  viewerSigned = false,
  onSignPress,
}: PetitionProps) {
  const theme = useTheme();
  const showProgress = goal !== undefined && goal > 0;
  const countLabel =
    goal !== undefined
      ? `${signatureCount.toLocaleString()} of ${goal.toLocaleString()} signatures`
      : `${signatureCount.toLocaleString()} ${signatureCount === 1 ? "signature" : "signatures"}`;

  return (
    <StructuredTile variant="attachment" gap={10}>
      <KindHeader icon={PenLine} label="Petition" />
      <Text style={styles.title}>{title}</Text>
      {ask != null ? <ExcerptText lines={3}>{ask}</ExcerptText> : null}
      {showProgress ? (
        <ProgressBar value={signatureCount} max={goal} />
      ) : null}
      <TileFooter
        meta={
          <View style={styles.countLine}>
            <Users size={14} color={theme.fgMuted} />
            <RNText
              style={[styles.countLabel, { color: theme.fgEmphasis }]}
              numberOfLines={1}
            >
              {countLabel}
            </RNText>
            {deadlineLabel != null ? (
              <>
                <RNText style={[styles.metaSep, { color: theme.fgMuted }]}>
                  {"\u00B7"}
                </RNText>
                <RNText
                  style={[styles.deadlineLabel, { color: theme.fgMuted }]}
                  numberOfLines={1}
                >
                  {deadlineLabel}
                </RNText>
              </>
            ) : null}
          </View>
        }
        action={
          onSignPress != null ? (
            <Button
              variant={viewerSigned ? "primary" : "simple"}
              onPress={viewerSigned ? undefined : onSignPress}
            >
              {viewerSigned ? "Signed" : "Sign"}
            </Button>
          ) : undefined
        }
      />
    </StructuredTile>
  );
}

export default Petition;

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  countLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  countLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  deadlineLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaSep: {
    fontSize: 12,
    paddingHorizontal: 2,
  },
});
