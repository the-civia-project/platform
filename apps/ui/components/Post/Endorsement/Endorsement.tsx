/**
 * Visual silhouette of a public endorsement record. Renders capacity
 * (who is speaking), a labelled target (person, organisation, bill, or
 * candidate), and a short statement -- the kit paints the shape; signature
 * capture, notarisation, and revocation workflows live upstream.
 */
import { BadgeCheck } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { KindHeader } from "../../KindHeader";
import { useTheme } from "../../use-theme";
import { RoleCaption } from "../../RoleCaption";
import { StatusBadge } from "../../StatusBadge";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";

/**
 * Who or what is being endorsed; drives a small pill label next to the target line.
 */
export type PostEndorsementTargetKind =
  | "person"
  | "org"
  | "bill"
  | "candidate";

/**
 * Tile payload paired with {@link "../Post".EndorsementMedia.endorsement}.
 */
export type PostEndorsement = {
  /**
   * Capacity in which the endorser speaks ("as mayor", "on behalf of the chapter").
   */
  endorserCapacity: string;
  /** Target kind; rendered as an uppercase pill. */
  targetKind: PostEndorsementTargetKind;
  /** Display name of the endorsed target. */
  targetLabel: string;
  /** Short endorsement statement. */
  statement: string;
};

export type EndorsementProps = {
  endorsement: PostEndorsement;
};

const TARGET_LABELS: Record<PostEndorsementTargetKind, string> = {
  person: "Person",
  org: "Organisation",
  bill: "Bill",
  candidate: "Candidate",
};

/**
 * @param props - {@link EndorsementProps}
 */
export function Endorsement({ endorsement }: EndorsementProps) {
  const theme = useTheme();

  return (
    <StructuredTile variant="record">
      <KindHeader icon={BadgeCheck} label="Endorsement" size="md" />
      <RoleCaption>{endorsement.endorserCapacity}</RoleCaption>
      <View style={styles.targetRow}>
        <StatusBadge label={TARGET_LABELS[endorsement.targetKind]} />
        <Text style={[styles.target, { color: theme.fgEmphasis }]}>
          {endorsement.targetLabel}
        </Text>
      </View>
      <RNText style={[styles.statement, { color: theme.fg }]}>
        {endorsement.statement}
      </RNText>
    </StructuredTile>
  );
}

export default Endorsement;

const styles = StyleSheet.create({
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  target: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  statement: {
    fontSize: 15,
    lineHeight: 22,
  },
});
