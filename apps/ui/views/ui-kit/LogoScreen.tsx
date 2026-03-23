/**
 * UI Kit screen for the {@link Logo} component. Each block shows one size preset (xs-xl) plus an
 * inline-row pattern (logo + wordmark) used in headers.
 */
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Logo, { type LogoSize } from "../../components/Logo";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";
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

/**
 * Row data for one logo size -- extends {@link ExampleBlockProps} with a React `key`.
 */
type LogoSizeRow = ExampleBlockProps & { key: string };

/**
 * Logical pixel dimension for each {@link LogoSize}; surfaced in usage snippets.
 */
const LOGO_DIM_PX: Record<LogoSize, number> = {
  xs: 16,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 128,
};

/**
 * Default-exported screen registered with the UI Kit stack as `logo`.
 */
export default function LogoScreen() {
  const theme = useTheme();
  const wellBg = theme.surfaceWell;
  const wellBorder = theme.borderHandle;

  const rows: LogoSizeRow[] = useMemo(() => {
    /** Wraps a logo sample on a neutral tile so transparent PNG bounds are visible. */
    const sampleWell = (child: ReactNode) => (
      <View
        style={[
          styles.sampleWell,
          { backgroundColor: wellBg, borderColor: wellBorder },
        ]}
      >
        {child}
      </View>
    );

    /** Builds an API snippet that includes the resolved dimension for a given preset. */
    const apiSnippet = (size: LogoSize) =>
      `<Logo size="${size}" />  // ${LOGO_DIM_PX[size]}x${LOGO_DIM_PX[size]} px`;

    return [
      {
        key: "xs",
        name: "xs",
        summary: (
          <Description>
            Smallest preset &mdash; fits dense UI such as list leading
            icons, compact nav, or favicon-scale branding beside metadata.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{apiSnippet("xs")}</Code>
          </Caption>
        ),
        samples: sampleWell(<Logo size="xs" />),
      },
      {
        key: "sm",
        name: "sm",
        summary: (
          <Description>
            Step up from <Code>xs</Code> for inline chips, small cards, or
            secondary marks where the mark should read clearly without
            dominating the row.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{apiSnippet("sm")}</Code>
          </Caption>
        ),
        samples: sampleWell(<Logo size="sm" />),
      },
      {
        key: "md",
        name: "md",
        summary: (
          <Description>
            Balanced default for marketing tiles, settings headers, or
            paired copy blocks where the logo and headline share visual
            weight.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{apiSnippet("md")}</Code>
          </Caption>
        ),
        samples: sampleWell(<Logo size="md" />),
      },
      {
        key: "lg",
        name: "lg",
        summary: (
          <Description>
            Hero-adjacent scale &mdash; splash sections, empty states, or
            sign-in panels where the brand should lead but still leave
            room for actions below.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{apiSnippet("lg")}</Code>
          </Caption>
        ),
        samples: sampleWell(<Logo size="lg" />),
      },
      {
        key: "xl",
        name: "xl",
        summary: (
          <Description>
            Largest preset &mdash; onboarding, marketing splash, or
            full-bleed brand moments. Avoid stacking multiple{" "}
            <Code>xl</Code> marks on one screen.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{apiSnippet("xl")}</Code>
          </Caption>
        ),
        samples: sampleWell(<Logo size="xl" />),
      },
      {
        key: "inline",
        name: "header-row",
        summary: (
          <Description>
            Common product pattern: tiny mark plus app name (see home).
            Keep the mark at <Code>xs</Code> so the wordmark stays primary;
            align on the text baseline in your row layout.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Logo size="xs" />`}</Code>
            <Caption>
              {" "}
              beside <Code>Text</Code> in a <Code>View</Code> row; use{" "}
              <Code>gap</Code> or padding for spacing.
            </Caption>
          </Caption>
        ),
        samples: (
          <View
            style={[
              styles.inlineHeader,
              { borderColor: wellBorder, backgroundColor: wellBg },
            ]}
          >
            <Logo size="xs" />
            <Text style={styles.inlineTitle}>The Civia Platform</Text>
          </View>
        ),
      },
    ];
  }, [wellBg, wellBorder]);

  return (
    <Page>
      <Lede>
        Brand mark from <Code>assets/logo.png</Code>, rendered with{" "}
        <Code>expo-image</Code> and{" "}
        <Code>contentFit=&quot;contain&quot;</Code>. Each block is one{" "}
        <Code>size</Code> preset; the sample sits on a neutral tile so
        transparency reads on both themes.
      </Lede>

      <Section title="Sizes">
        {rows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === rows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  sampleWell: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignSelf: "flex-start",
  },
  inlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inlineTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
});
