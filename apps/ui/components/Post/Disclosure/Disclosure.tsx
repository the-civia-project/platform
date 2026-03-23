/**
 * Visual silhouette of a transparency disclosure tile. Renders disclosure
 * type, counterparty, amount with currency, and purpose -- the kit does not
 * validate amounts; ledger and compliance live upstream.
 */
import { Eye } from "lucide-react-native";
import { StyleSheet, Text as RNText } from "react-native";
import { KindHeader } from "../../KindHeader";
import { StatusBadge } from "../../StatusBadge";
import { StructuredTile } from "../../StructuredTile";
import { useTheme } from "../../use-theme";

/**
 * Disclosure category; maps to a short uppercase pill.
 */
export type PostDisclosureKind =
  | "received"
  | "paid"
  | "owns"
  | "paid-by";

/**
 * Payload for {@link "../Post".DisclosureMedia.disclosure}.
 */
export type PostDisclosure = {
  kind: PostDisclosureKind;
  /** Other party named in the disclosure. */
  counterparty: string;
  /** Numeric amount as already formatted for display ("12,500"). */
  amountLabel: string;
  /** ISO-style or display currency code ("EUR", "RON"). */
  currency: string;
  /** One-line purpose ("Speaking fee", "Campaign ad buy"). */
  purpose: string;
};

export type DisclosureProps = {
  disclosure: PostDisclosure;
};

const KIND_LABELS: Record<PostDisclosureKind, string> = {
  received: "Received",
  paid: "Paid",
  owns: "Owns",
  "paid-by": "Paid by",
};

/**
 * @param props - {@link DisclosureProps}
 */
export function Disclosure({ disclosure }: DisclosureProps) {
  const theme = useTheme();

  return (
    <StructuredTile variant="record">
      <KindHeader icon={Eye} label="Disclosure" size="md" />
      <StatusBadge label={KIND_LABELS[disclosure.kind]} />
      <RNText style={[styles.row, { color: theme.fgEmphasis }]}>
        {disclosure.counterparty}
      </RNText>
      <RNText style={[styles.amount, { color: theme.fg }]}>
        {disclosure.amountLabel} {disclosure.currency}
      </RNText>
      <RNText style={[styles.purpose, { color: theme.fgMuted }]}>
        {disclosure.purpose}
      </RNText>
    </StructuredTile>
  );
}

export default Disclosure;

const styles = StyleSheet.create({
  row: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  amount: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  purpose: {
    fontSize: 14,
    lineHeight: 20,
  },
});
