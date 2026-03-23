/**
 * Visual silhouette of a parliamentary or formal vote-record
 * attachment. Renders a "Vote record" eyebrow, bill / motion
 * reference, optional chamber label, the member's voting capacity,
 * a three-way tally row (yea / nay / abstain) with percentage bars,
 * and an optional affordance to register the viewer's vote when
 * they have not yet cast one. **Does not run a ballot** -- the kit
 * primitive paints the shape; roll-call persistence, quorum rules,
 * and identity-bound eligibility live upstream.
 *
 * Reach for this kind when an identified actor publishes how they
 * voted on a bill, resolution, or committee motion -- distinct
 * from {@link "../Poll".Poll}, which models open consultation
 * ballots rather than a single member's recorded position.
 */
import { Landmark } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { ExcerptText } from "../../ExcerptText";
import { KindHeader } from "../../KindHeader";
import { ProportionRow } from "../../ProportionRow";
import { RoleCaption } from "../../RoleCaption";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * How the viewer's ballot is recorded for this vote. Mirrors the
 * three standard parliamentary positions; the kit doesn't model
 * "paired" / "absent" / "present but not voting" -- product code
 * maps those to {@link PostVoteRecord.abstain} or omits the viewer
 * slot entirely.
 */
export type PostVoteChoice = "yea" | "nay" | "abstain";

/**
 * Tile-data shape -- the half of {@link VoteRecordProps} that
 * describes the vote itself. Pairs 1:1 with
 * {@link "../Post".VoteRecordMedia.voteRecord}.
 */
export type PostVoteRecord = {
  /**
   * Bill or motion identifier as it appears in the public record
   * ("Bill 42 / 2026", "Motion M-14 (budget amendment)").
   */
  billReference: string;
  /**
   * Optional one-line title of the motion when it differs from the
   * bill reference alone.
   */
  motionTitle?: string;
  /**
   * Optional chamber or body label ("City council plenary",
   * "Finance committee").
   */
  chamber?: string;
  /**
   * Capacity in which the member cast the vote -- the human-readable
   * string the public record carries ("as ward delegate",
   * "ex officio observer with vote").
   */
  voterCapacity: string;
  /** Running yea tally across the body that voted. */
  yea: number;
  /** Running nay tally. */
  nay: number;
  /**
   * Running abstain tally. Pass `0` or omit when the body does not
   * record abstentions separately.
   * @defaultValue 0
   */
  abstain?: number;
  /**
   * When set, the viewer has already recorded a position -- the
   * matching tally row is highlighted with the kit's primary accent
   * and every row is inert. When omitted, rows become pressable iff
   * {@link VoteRecordProps.onVotePress} is wired.
   */
  viewerVote?: PostVoteChoice;
};

/**
 * Public props for {@link VoteRecord}.
 */
export type VoteRecordProps = PostVoteRecord & {
  /**
   * Optional press handler. Fires with `"yea"`, `"nay"`, or
   * `"abstain"` when the viewer taps a row. When omitted, every row
   * is static. When wired *and* {@link PostVoteRecord.viewerVote}
   * is unset, rows become pressable; the kit never fires the
   * handler when `viewerVote` is already set.
   */
  onVotePress?: (choice: PostVoteChoice) => void;
};

/**
 * Renders the vote-record silhouette described in the file header.
 *
 * @param props - {@link VoteRecordProps}
 */
export function VoteRecord({
  billReference,
  motionTitle,
  chamber,
  voterCapacity,
  yea,
  nay,
  abstain = 0,
  viewerVote,
  onVotePress,
}: VoteRecordProps) {
  const theme = useTheme();
  const total = yea + nay + abstain;
  const hasVoted = viewerVote !== undefined;

  const rows: ReadonlyArray<{
    choice: PostVoteChoice;
    label: string;
    count: number;
  }> = [
    { choice: "yea", label: "Yea", count: yea },
    { choice: "nay", label: "Nay", count: nay },
    { choice: "abstain", label: "Abstain", count: abstain },
  ];

  return (
    <StructuredTile variant="attachment">
      <KindHeader icon={Landmark} label="Vote record" />
      <Text style={styles.bill}>{billReference}</Text>
      {motionTitle != null ? (
        <ExcerptText lines={3}>{motionTitle}</ExcerptText>
      ) : null}
      {chamber != null ? (
        <RNText style={[styles.chamber, { color: theme.fgMuted }]}>
          {chamber}
        </RNText>
      ) : null}
      <RoleCaption italic>{voterCapacity}</RoleCaption>
      <View style={styles.tally}>
        {rows.map((row) => {
          const ratio = total > 0 ? row.count / total : 0;
          return (
            <ProportionRow
              key={row.choice}
              label={row.label}
              ratio={ratio}
              trailing={`${row.count.toLocaleString()} · ${Math.round(ratio * 100)}%`}
              selected={row.choice === viewerVote}
              labelLines={1}
              onPress={
                hasVoted || onVotePress == null
                  ? undefined
                  : () => onVotePress(row.choice)
              }
              accessibilityLabel={`Record ${row.label} vote`}
            />
          );
        })}
      </View>
      <RNText style={[styles.footer, { color: theme.fgMuted }]}>
        {total === 0
          ? "No votes recorded yet"
          : total === 1
            ? "1 vote recorded"
            : `${total.toLocaleString()} votes recorded`}
      </RNText>
    </StructuredTile>
  );
}

export default VoteRecord;

const styles = StyleSheet.create({
  bill: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  chamber: {
    fontSize: 12,
    lineHeight: 16,
  },
  tally: {
    gap: 8,
    marginTop: 4,
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
