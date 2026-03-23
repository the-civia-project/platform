/**
 * UI Kit screen for the layout primitives in `components/`: {@link Page}, {@link Section},
 * {@link Cluster}, {@link Hero}, and the shell {@link ../../components/ThemePatternBackground}.
 * Each block documents one wrapper that screens use to assemble content. The kit-internal
 * {@link ExampleBlock} (under `./components/`) is the scaffolding that renders each row -- it's
 * used here but not demoed; it's not a public primitive and has no `apps/ui/components/` counterpart.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Cluster } from "../../components/Cluster";
import ThemePatternBackground from "../../components/ThemePatternBackground";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";
import { Hero } from "../../components/Hero";
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
import {
  ThemeFlavorProvider,
  useTheme,
} from "../../components/use-theme";

/**
 * Row data for one layout example -- extends {@link ExampleBlockProps} with a stable React `key`.
 */
type LayoutRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `layout`.
 */
export default function LayoutScreen() {
  const theme = useTheme();
  // Tile bg / border for the Cluster pill samples. The well + handle pair
  // reads as a chip-shaped recess on either theme without inventing new
  // values inline.
  const pillBg = theme.surfaceWell;
  const pillBorder = theme.borderHandle;

  const rows: LayoutRow[] = useMemo(
    () => [
      {
        key: "theme-pattern-background",
        name: "ThemePatternBackground",
        summary: (
          <Description>
            Repeating SVG texture behind the app shell (see <Code>App.tsx</Code>{" "}
            <Code>AppChrome</Code>): one seamless tile per{" "}
            <Code>ThemeFlavor</Code>, tinted from the active palette. Thumbnails
            use nested <Code>ThemeFlavorProvider</Code> so all four read with the
            current light/dark scheme.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ThemePatternBackground />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Cluster>
              {(
                ["gazette", "matrix", "pulse", "ember"] as const
              ).map((fl) => (
                <View key={fl} style={styles.patternCell}>
                  <ThemeFlavorProvider defaultFlavor={fl}>
                    <View
                      style={[
                        styles.patternThumb,
                        {
                          borderColor: theme.borderDefault,
                          backgroundColor: theme.surfaceCard,
                        },
                      ]}
                    >
                      <ThemePatternBackground width={88} height={88} />
                    </View>
                  </ThemeFlavorProvider>
                  <Caption>
                    <Code>{fl}</Code>
                  </Caption>
                </View>
              ))}
            </Cluster>
          </View>
        ),
      },
      {
        key: "page",
        name: "Page",
        summary: (
          <Description>
            Outer scrolling shell: a flex root containing a vertical{" "}
            <Code>ScrollView</Code> with kit-standard padding. This whole
            screen is wrapped in one.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Page>...sections...</Page>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Description>(Wraps this screen.)</Description>
          </View>
        ),
      },
      {
        key: "section",
        name: "Section",
        summary: (
          <Description>
            Titled grouping inside a <Code>Page</Code>: heading (default)
            or small uppercase eyebrow via <Code>level</Code>, optional
            subtitle, then children. Used to bucket related content under
            one heading.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Section title="..." subtitle="..." level="heading | eyebrow">...</Section>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Section
              title="Sample section"
              subtitle="Title + optional subtitle + children."
            >
              <Description>
                Drop related content here &mdash; cards, rows, or any
                blocks that belong under the same heading.
              </Description>
            </Section>
          </View>
        ),
      },
      {
        key: "cluster",
        name: "Cluster",
        summary: (
          <Description>
            Wrapping flex row with a fixed gap. Drop in tile-shaped
            children (cards, pills, tags) and they break onto multiple
            lines as needed.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Cluster>...children...</Cluster>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Cluster>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
              >
                <Text>One</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
              >
                <Text>Two</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
              >
                <Text>Three</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
              >
                <Text>Four</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
              >
                <Text>Five</Text>
              </View>
            </Cluster>
          </View>
        ),
      },
      {
        key: "hero",
        name: "Hero",
        summary: (
          <Description>
            Top-of-screen panel: brand logo on the left, eyebrow / title /
            subtitle on the right, and an optional hint footer separated
            by a hairline divider.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Hero eyebrow="..." title="..." subtitle="..." hint="..." />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Hero
              eyebrow="Sample"
              title="Hero panel"
              subtitle="Brand mark on the left; eyebrow, title and subtitle on the right."
              hint="The optional hint sits in a divided footer."
            />
          </View>
        ),
      },
    ],
    [pillBg, pillBorder, theme.borderDefault, theme.surfaceCard],
  );

  return (
    <Page>
      <Lede>
        Composable wrappers screens use to assemble content. <Code>Page</Code>{" "}
        is the outer shell, <Code>Section</Code> buckets related content,{" "}
        <Code>Cluster</Code> wraps tile rows, and <Code>Hero</Code> introduces
        a screen.
      </Lede>

      <Section
        title="Wrappers"
        subtitle="Shared shells used across every UI Kit screen."
      >
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
  // Stretches a sample to fill the example row -- needed for wrappers whose layout
  // (Section, Hero, full-width Cluster) only reads at the row's full width.
  stretch: {
    flexBasis: "100%",
    width: "100%",
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  patternCell: {
    alignItems: "center",
    gap: 6,
  },
  patternThumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
