/**
 * Visual silhouette of a fact-check attachment. Renders the
 * "Fact-check" eyebrow, the claim being checked, a verdict badge
 * (one of five tiers -- `true / mostly-true / misleading / false /
 * unverifiable`), and an optional list of evidence rows pointing
 * to the sources that back the verdict. **Does not run a
 * verification pipeline** -- the kit primitive paints the shape;
 * the actual sourcing, editorial review, and audit trail live
 * upstream.
 *
 * Reach for this kind when an identified actor (journalist,
 * editorial outlet, civic watchdog) publishes a structured
 * verdict on a public claim -- not for ad-hoc commentary. The
 * five verdict tiers are deliberately small so a long scroll of
 * fact-checks reads consistently; localised labels can be passed
 * via {@link FactCheckProps.verdictLabels} (defaults come from
 * {@link "./resolve-surface".DEFAULT_VERDICT_LABELS}).
 *
 * The verdict-badge palette lives in {@link "./resolve-surface"};
 * the React shell {@link "./surface".useFactCheckBadgeSurface}
 * resolves it against the current colour scheme. Both files are
 * unit-tested.
 */
import { Quote, ScanSearch } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { BorderedRow } from "../../BorderedRow";
import { KindHeader } from "../../KindHeader";
import { QuoteRail } from "../../QuoteRail";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";
import {
  DEFAULT_VERDICT_LABELS,
  type FactCheckVerdict,
} from "./resolve-surface";
import { useFactCheckBadgeSurface } from "./surface";

/**
 * One source row inside a {@link PostFactCheck}. The kit doesn't
 * fetch the source; pressing a row fires
 * {@link FactCheckProps.onEvidencePress} with the row's
 * {@link PostFactCheckEvidence.id} so the host can route to the
 * right URL / detail view.
 */
export type PostFactCheckEvidence = {
  /** Stable identifier used as the React key + the press-handler argument. */
  id: string;
  /**
   * Display label for the evidence row. Renders as the row's
   * primary line ("Council Hansard transcript", "WHO data
   * release"). The kit caps the line at 2 wraps; longer values
   * are truncated with an ellipsis.
   */
  label: string;
  /**
   * Optional one-line source / publisher label ("Hansard, June
   * 2026", "WHO Bulletin"). Rendered as muted copy on a second
   * line under the label; pass `undefined` to render just the
   * label.
   */
  sourceLabel?: string;
};

/**
 * Tile-data shape -- the half of {@link FactCheckProps} that
 * describes the fact-check itself. Pairs 1:1 with
 * {@link "../Post".FactCheckMedia.factCheck}.
 */
export type PostFactCheck = {
  /**
   * The public claim being checked. Rendered inside a left-rail
   * quote inset with the {@link Quote} glyph so it visually reads
   * as "we are evaluating *this*"; the verdict and evidence sit
   * below.
   */
  claim: string;
  /** The verdict the checker assigned to the claim. */
  verdict: FactCheckVerdict;
  /**
   * Optional editorial summary expanding on the verdict (one
   * sentence to a short paragraph). Renders as muted body copy
   * under the verdict badge; the kit caps it at 4 lines. Use
   * sparingly -- detail belongs in the linked sources, not in the
   * tile.
   */
  summary?: string;
  /**
   * Optional list of evidence rows. Each row carries a stable id
   * and a label; empty arrays / `undefined` render the tile
   * without an evidence section -- a fact-check can be "verdict
   * only" when the evaluation is self-evident.
   */
  evidence?: PostFactCheckEvidence[];
  /**
   * Optional human-readable timestamp ("Checked June 12, 2026",
   * "Updated last Friday"). Rendered in the footer as a muted
   * line; the kit doesn't format times.
   */
  checkedAtLabel?: string;
};

/**
 * Public props for {@link FactCheck}.
 */
export type FactCheckProps = PostFactCheck & {
  /**
   * Optional localised override for the verdict labels. The kit
   * falls back to {@link DEFAULT_VERDICT_LABELS} for any verdict
   * not present in the bag, so callers can override one or two
   * tiers without re-declaring the whole table.
   */
  verdictLabels?: Partial<Record<FactCheckVerdict, string>>;
  /**
   * Optional press handler. Fires with the tapped
   * {@link PostFactCheckEvidence.id} when an evidence row is
   * tapped. When omitted, the rows render as static (no
   * `Pressable`) -- the tile reads as a record of the sources
   * without surfacing a navigation affordance.
   */
  onEvidencePress?: (evidenceId: string) => void;
};

/**
 * Renders the fact-check silhouette described in the file header.
 *
 * @param props - {@link FactCheckProps}
 */
export function FactCheck({
  claim,
  verdict,
  summary,
  evidence,
  checkedAtLabel,
  verdictLabels,
  onEvidencePress,
}: FactCheckProps) {
  const theme = useTheme();
  const badgeSurface = useFactCheckBadgeSurface(verdict);
  const label = verdictLabels?.[verdict] ?? DEFAULT_VERDICT_LABELS[verdict];

  return (
    <StructuredTile variant="attachment">
      <KindHeader icon={ScanSearch} label="Fact-check" />
      <QuoteRail leading={<Quote size={14} color={theme.fgMuted} />}>
        <Text style={styles.claim}>{claim}</Text>
      </QuoteRail>
      <View style={styles.verdictRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeSurface.backgroundColor,
              borderColor: badgeSurface.borderColor,
              borderWidth: badgeSurface.borderWidth,
            },
          ]}
        >
          <RNText style={[styles.badgeLabel, { color: badgeSurface.color }]}>
            {label}
          </RNText>
        </View>
      </View>
      {summary != null ? (
        <RNText
          style={[styles.summary, { color: theme.fg }]}
          numberOfLines={4}
        >
          {summary}
        </RNText>
      ) : null}
      {evidence && evidence.length > 0 ? (
        <View style={styles.evidence}>
          {evidence.map((e) => (
            <EvidenceRow
              key={e.id}
              evidence={e}
              onPress={onEvidencePress ? () => onEvidencePress(e.id) : undefined}
            />
          ))}
        </View>
      ) : null}
      {checkedAtLabel ? (
        <RNText style={[styles.footer, { color: theme.fgMuted }]}>
          {checkedAtLabel}
        </RNText>
      ) : null}
    </StructuredTile>
  );
}

export default FactCheck;

/**
 * One row inside the evidence section. Renders the label and an
 * optional source label on a second muted line; pressable when
 * `onPress` is wired, static otherwise.
 *
 * Kept private to this file because the row's geometry only makes
 * sense inside the fact-check tile.
 */
function EvidenceRow({
  evidence,
  onPress,
}: {
  evidence: PostFactCheckEvidence;
  onPress?: () => void;
}) {
  return (
    <BorderedRow
      title={evidence.label}
      subtitle={evidence.sourceLabel}
      onPress={onPress}
      accessibilityLabel={`Open evidence: ${evidence.label}`}
    />
  );
}

const styles = StyleSheet.create({
  claim: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    fontStyle: "italic",
  },
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  evidence: {
    gap: 6,
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
