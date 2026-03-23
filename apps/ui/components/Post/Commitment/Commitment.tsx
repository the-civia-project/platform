/**
 * Visual silhouette of a recorded commitment (speech-act). Renders the
 * committer's capacity, the commitment text, a by-date label, and an optional
 * fulfilment status line -- the kit does not track deadlines; product code
 * owns reminders and breach detection.
 */
import { FileSignature } from "lucide-react-native";
import { StyleSheet, Text as RNText } from "react-native";
import { KindHeader } from "../../KindHeader";
import { RoleCaption } from "../../RoleCaption";
import { StructuredTile } from "../../StructuredTile";
import { useTheme } from "../../use-theme";

/**
 * Payload for {@link "../Post".CommitmentMedia.commitment}.
 */
export type PostCommitment = {
  /** Capacity in which the committer binds themselves ("as party leader"). */
  committerCapacity: string;
  /** The commitment wording as published. */
  commitmentText: string;
  /** Human-readable target date ("by 31 December 2026"). */
  byDateLabel: string;
  /**
   * Optional status line ("On track", "Partially met", "Missed").
   * @defaultValue undefined
   */
  fulfillmentLabel?: string;
};

export type CommitmentProps = {
  commitment: PostCommitment;
};

/**
 * @param props - {@link CommitmentProps}
 */
export function Commitment({ commitment }: CommitmentProps) {
  const theme = useTheme();

  return (
    <StructuredTile variant="record">
      <KindHeader icon={FileSignature} label="Commitment" size="md" />
      <RoleCaption>{commitment.committerCapacity}</RoleCaption>
      <RNText style={[styles.text, { color: theme.fg }]}>
        {commitment.commitmentText}
      </RNText>
      <RNText style={[styles.date, { color: theme.fgEmphasis }]}>
        {commitment.byDateLabel}
      </RNText>
      {commitment.fulfillmentLabel != null &&
      commitment.fulfillmentLabel !== "" ? (
        <RNText style={[styles.status, { color: theme.fgMuted }]}>
          {commitment.fulfillmentLabel}
        </RNText>
      ) : null}
    </StructuredTile>
  );
}

export default Commitment;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  status: {
    fontSize: 13,
    lineHeight: 18,
  },
});
