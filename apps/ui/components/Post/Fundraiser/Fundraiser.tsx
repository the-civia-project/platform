/**
 * Visual silhouette of a fundraiser attachment. Renders the cause
 * (title + supporting paragraph), a money-progress bar, a footer
 * row with the running tally + goal + optional deadline +
 * transparency link, and an optional "Donate" affordance. **Does
 * not run a donation pipeline** -- the kit primitive paints the
 * shape; real payments, identity-bound donation records, ledger /
 * transparency exports, and deadline enforcement live upstream of
 * this file, same precedent {@link "../Poll".Poll} /
 * {@link "../Petition".Petition} use.
 *
 * The component is **read-only by default**: when
 * {@link FundraiserProps.onDonatePress} is omitted there is no
 * button. When the handler is wired the button reads "Donate" and
 * presses fire normally; donations can come in multiple rounds, so
 * unlike petition / RSVP there is no "viewer has already
 * participated" inert state -- a donor can give again.
 *
 * Amounts are rendered through `Intl.NumberFormat` with the
 * `style: "currency"` flag using whatever {@link PostFundraiser.currency}
 * the host supplies. Kit doesn't normalise the currency code (no
 * uppercasing, no fallback) -- callers are expected to pass a valid
 * ISO 4217 code; an invalid code throws inside `Intl.NumberFormat`
 * (the kit doesn't catch).
 *
 * @example
 * ```tsx
 * <Fundraiser
 *   title="Repair the community-centre roof"
 *   pitch="The east-wing roof leaks every storm. We're raising for materials + a contractor for a single weekend repair."
 *   raised={4820}
 *   goal={8000}
 *   currency="EUR"
 *   deadlineLabel="Open until June 30"
 *   transparencyLabel="Read the budget"
 *   onDonatePress={() => console.log("Donate")}
 * />
 * ```
 */
import { HeartHandshake, Link2 } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import Button from "../../Button";
import { ExcerptText } from "../../ExcerptText";
import { KindHeader } from "../../KindHeader";
import { MetaLine } from "../../MetaLine";
import { ProgressBar } from "../../ProgressBar";
import { StructuredTile } from "../../StructuredTile";
import { TileFooter } from "../../TileFooter";
import { Text } from "../../Typography";
import { webFocusOutlineStyle } from "../../../core/web-focus-outline";
import { useTheme } from "../../use-theme";

/**
 * Tile-data shape -- the half of {@link FundraiserProps} that
 * describes the fundraiser itself. Carved out as a named type so
 * consumers that *store* fundraiser attachments can type their
 * records with a single shape and pair each record with its own
 * press handler at render time.
 *
 * Pairs 1:1 with {@link "../Post".FundraiserMedia.fundraiser}.
 */
export type PostFundraiser = {
  /**
   * Headline cause / call to give. Rendered in the kit's emphasised
   * body weight above the supporting paragraph.
   */
  title: string;
  /**
   * Optional supporting paragraph. Fills out the context the title
   * can't carry ("what the money buys", "why now", "who benefits").
   * Rendered as a 3-line muted paragraph under the title; pass
   * `undefined` to render just the title + progress shape.
   */
  pitch?: string;
  /** Running amount raised. Drives the progress-bar fill against {@link goal}. */
  raised: number;
  /** Target amount. Used to compute the progress ratio and the footer's "of" line. */
  goal: number;
  /**
   * ISO 4217 currency code passed to `Intl.NumberFormat` for both
   * amounts. The kit doesn't normalise or fall back; an invalid code
   * throws inside `Intl.NumberFormat`.
   */
  currency: string;
  /**
   * Optional human-readable deadline ("Open until June 30", "Closes
   * in 12 days"). Rendered next to the amounts in the footer.
   */
  deadlineLabel?: string;
  /**
   * Optional transparency-link label. When set the tile renders a
   * small chain-icon + label row under the footer that fires
   * {@link FundraiserProps.onTransparencyPress} when tapped --
   * lets the host link to a budget / ledger / public spend report.
   * The kit doesn't carry the URL itself; the press handler is the
   * only contract.
   */
  transparencyLabel?: string;
};

/**
 * Public props for {@link Fundraiser}.
 */
export type FundraiserProps = PostFundraiser & {
  /**
   * Optional press handler for the Donate button. When omitted no
   * button is rendered; the tile reads as a record of the
   * fundraiser's state.
   */
  onDonatePress?: () => void;
  /**
   * Optional press handler for the transparency-link row. Only
   * relevant when {@link PostFundraiser.transparencyLabel} is set;
   * when the label is set and this handler is omitted the row is
   * still rendered but static (no tap target).
   */
  onTransparencyPress?: () => void;
};

/**
 * Renders the fundraiser silhouette described in the file header.
 *
 * @param props - {@link FundraiserProps}
 */
export function Fundraiser({
  title,
  pitch,
  raised,
  goal,
  currency,
  deadlineLabel,
  transparencyLabel,
  onDonatePress,
  onTransparencyPress,
}: FundraiserProps) {
  const theme = useTheme();
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return (
    <StructuredTile variant="attachment" gap={10}>
      <KindHeader icon={HeartHandshake} label="Fundraiser" />
      <Text style={styles.title}>{title}</Text>
      {pitch != null ? <ExcerptText lines={3}>{pitch}</ExcerptText> : null}
      <ProgressBar value={raised} max={goal} />
      <TileFooter
        meta={
          <View style={styles.amountLine}>
            <RNText
              style={[styles.raisedLabel, { color: theme.fgEmphasis }]}
              numberOfLines={1}
            >
              {formatter.format(raised)}
            </RNText>
            <RNText
              style={[styles.goalLabel, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {" of "}
              {formatter.format(goal)}
            </RNText>
            {deadlineLabel != null ? (
              <MetaLine segments={[deadlineLabel]} />
            ) : null}
          </View>
        }
        action={
          onDonatePress != null ? (
            <Button variant="primary" onPress={onDonatePress}>
              Donate
            </Button>
          ) : undefined
        }
      />
      {transparencyLabel != null ? (
        <TransparencyRow
          label={transparencyLabel}
          onPress={onTransparencyPress}
        />
      ) : null}
    </StructuredTile>
  );
}

export default Fundraiser;

function TransparencyRow({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const body = (
    <View style={styles.transparencyRow}>
      <Link2 size={13} color={theme.fgMuted} />
      <RNText
        style={[
          styles.transparencyLabel,
          { color: onPress != null ? theme.primary : theme.fgMuted },
        ]}
        numberOfLines={1}
      >
        {label}
      </RNText>
    </View>
  );
  if (onPress == null) {
    return body;
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={webFocusOutlineStyle()}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  raisedLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  goalLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  transparencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  transparencyLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
