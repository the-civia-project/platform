/**
 * UI Kit screen for structured-post building blocks extracted from civic
 * attachment tiles: {@link StructuredTile}, {@link KindHeader},
 * {@link ProportionRow}, and related chrome. Composed on {@link PostScreen}
 * inside Poll, Petition, Fact-check, and other kinds.
 */
import { useMemo, useState } from "react";
import {
  FileText,
  PenLine,
  Quote,
  Users,
} from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import Button from "../../components/Button";
import { BorderedRow } from "../../components/BorderedRow";
import { ExcerptText } from "../../components/ExcerptText";
import { KindHeader } from "../../components/KindHeader";
import { MetaLine } from "../../components/MetaLine";
import { ProgressBar } from "../../components/ProgressBar";
import { ProportionRow } from "../../components/ProportionRow";
import { QuoteRail } from "../../components/QuoteRail";
import { RoleCaption } from "../../components/RoleCaption";
import { StatusBadge } from "../../components/StatusBadge";
import { StructuredTile } from "../../components/StructuredTile";
import { TileFooter } from "../../components/TileFooter";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Text,
} from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

type DemoRow = ExampleBlockProps & { key: string };

function StructuredTileVariantsDemo() {
  return (
    <View style={styles.stack}>
      <StructuredTile variant="attachment">
        <KindHeader icon={PenLine} label="Attachment" />
        <Description>
          16px radius — engagement tiles (Poll, Petition, Fundraiser, …).
        </Description>
      </StructuredTile>
      <StructuredTile variant="record">
        <KindHeader icon={PenLine} label="Record" size="md" />
        <Description>
          12px radius — endorsements, disclosures, commitments.
        </Description>
      </StructuredTile>
      <StructuredTile
        variant="teaser"
        onPress={() => {}}
        accessibilityHint="Opens the full record"
      >
        <KindHeader icon={PenLine} label="Teaser" size="md" />
        <Description>
          12px radius + card fill — archetype feed rows (Article, Decree, …).
        </Description>
      </StructuredTile>
    </View>
  );
}

function ProportionRowDemo() {
  const [choice, setChoice] = useState<string | undefined>("yea");

  return (
    <View style={styles.stack}>
      <ProportionRow
        label="Yea"
        ratio={0.62}
        trailing="62%"
        selected={choice === "yea"}
        onPress={() => setChoice("yea")}
      />
      <ProportionRow
        label="Nay"
        ratio={0.28}
        trailing="840 · 28%"
        selected={choice === "nay"}
        labelLines={1}
        onPress={() => setChoice("nay")}
      />
      <ProportionRow label="Abstain" ratio={0.1} trailing="10%" />
    </View>
  );
}

function TileFooterDemo() {
  const theme = useTheme();

  return (
    <TileFooter
      meta={
        <View style={styles.footerMeta}>
          <Users size={14} color={theme.fgMuted} />
          <RNText style={[styles.footerCount, { color: theme.fgEmphasis }]}>
            1,842 of 2,500 signatures
          </RNText>
          <MetaLine segments={["Open until July 1"]} />
        </View>
      }
      action={
        <Button variant="simple" onPress={() => {}}>
          Sign
        </Button>
      }
    />
  );
}

function QuoteRailDemo() {
  const theme = useTheme();

  return (
    <QuoteRail leading={<Quote size={14} color={theme.fgMuted} />}>
      <Text style={styles.claim}>
        The council spent twice the budget on consultants in 2025.
      </Text>
    </QuoteRail>
  );
}

function BorderedRowDemo() {
  const theme = useTheme();

  return (
    <View style={styles.stack}>
      <BorderedRow
        leading={<FileText size={16} color={theme.fgMuted} />}
        title="budget-2026.csv"
        subtitle="Council spending by ward"
        trailing={
          <RNText style={{ color: theme.fgMuted, fontSize: 11 }}>CSV</RNText>
        }
        onPress={() => {}}
      />
      <BorderedRow
        title="Hansard transcript"
        subtitle="June 2026 sitting"
        onPress={() => {}}
      />
    </View>
  );
}

/**
 * Default-exported screen registered with the UI Kit stack as `post-patterns`.
 */
export default function PostPatternsScreen() {
  const shellRows: DemoRow[] = useMemo(
    () => [
      {
        key: "structured-tile",
        name: "StructuredTile",
        summary: (
          <Description>
            Hairline-bordered shell for post attachments and archetype teasers.
            Three variants control radius and fill.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<StructuredTile variant="attachment">…</StructuredTile>`}</Code>
          </Caption>
        ),
        samples: <StructuredTileVariantsDemo />,
      },
      {
        key: "kind-header",
        name: "KindHeader",
        summary: (
          <Description>
            16px icon + uppercase kind label at the top of structured tiles.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<KindHeader icon={PenLine} label="Petition" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.rowPair}>
            <KindHeader icon={PenLine} label="Petition" />
            <KindHeader icon={PenLine} label="Article" size="md" />
          </View>
        ),
      },
      {
        key: "status-badge",
        name: "StatusBadge",
        summary: (
          <Description>
            Recessed uppercase capsule on <Code>surfaceWell</Code> — target
            kind, disclosure category, paywall.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<StatusBadge label="Organisation" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.rowPair}>
            <StatusBadge label="Bill" />
            <StatusBadge label="Received" />
          </View>
        ),
      },
      {
        key: "role-caption",
        name: "RoleCaption",
        summary: (
          <Description>
            Muted capacity line — who is speaking or voting.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<RoleCaption italic>as ward delegate</RoleCaption>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stackTight}>
            <RoleCaption>as mayor</RoleCaption>
            <RoleCaption italic>as ward delegate</RoleCaption>
          </View>
        ),
      },
      {
        key: "excerpt-text",
        name: "ExcerptText",
        summary: (
          <Description>
            Clamped muted supporting copy under a tile title (ask, pitch, dek).
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ExcerptText lines={3}>…</ExcerptText>`}</Code>
          </Caption>
        ),
        samples: (
          <ExcerptText>
            The night bus on Route 22 was cut last spring. We're asking the
            council to restore the evening shift so shift workers can get home
            safely.
          </ExcerptText>
        ),
      },
      {
        key: "meta-line",
        name: "MetaLine",
        summary: (
          <Description>
            Dot-separated metadata segments for footers and datelines.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<MetaLine segments={["12 June", "4 min read"]} />`}</Code>
          </Caption>
        ),
        samples: (
          <MetaLine
            segments={["1,200,000 rows", "CC BY 4.0", "Updated weekly"]}
          />
        ),
      },
      {
        key: "quote-rail",
        name: "QuoteRail",
        summary: (
          <Description>
            Left-rail inset for quoted claims (fact-check) or embed excerpts.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<QuoteRail leading={<Quote />}>Claim…</QuoteRail>`}</Code>
          </Caption>
        ),
        samples: <QuoteRailDemo />,
      },
    ],
    [],
  );

  const engagementRows: DemoRow[] = useMemo(
    () => [
      {
        key: "progress-bar",
        name: "ProgressBar",
        summary: (
          <Description>
            6px horizontal track — petition signatures, fundraiser totals.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ProgressBar value={1842} max={2500} />`}</Code>
          </Caption>
        ),
        samples: <ProgressBar value={1842} max={2500} />,
      },
      {
        key: "proportion-row",
        name: "ProportionRow",
        summary: (
          <Description>
            Bordered row with absolute fill — Poll options and vote-record
            tallies. Pass <Code>selected</Code> + <Code>onPress</Code> for ballots.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ProportionRow label="Yea" ratio={0.62} trailing="62%" selected onPress={…} />`}</Code>
          </Caption>
        ),
        samples: <ProportionRowDemo />,
      },
      {
        key: "tile-footer",
        name: "TileFooter",
        summary: (
          <Description>
            Bottom row: flexible metadata left, optional action button right.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TileFooter meta={…} action={<Button>Sign</Button>} />`}</Code>
          </Caption>
        ),
        samples: <TileFooterDemo />,
      },
      {
        key: "bordered-row",
        name: "BorderedRow",
        summary: (
          <Description>
            Download and evidence rows inside Dataset and Fact-check tiles.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<BorderedRow title="…" subtitle="…" onPress={…} />`}</Code>
          </Caption>
        ),
        samples: <BorderedRowDemo />,
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        Building blocks shared by civic post attachments under{" "}
        <Code>components/Post/</Code>. Each kind composes these primitives;
        see <Code>PostScreen</Code> for full tiles in context.
      </Lede>

      <Section
        title="Shell & metadata"
        subtitle="Tile envelope, kind label, and supporting copy."
      >
        {shellRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === shellRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Engagement & lists"
        subtitle="Progress, ballots, footers, and file rows."
      >
        {engagementRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === engagementRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    alignSelf: "stretch",
    gap: 10,
  },
  stackTight: {
    width: "100%",
    gap: 6,
  },
  rowPair: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  footerCount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  claim: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    fontWeight: "500",
  },
});
