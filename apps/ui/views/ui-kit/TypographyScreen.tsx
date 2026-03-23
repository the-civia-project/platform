/**
 * UI Kit screen for `components/Typography.tsx`: documents the themed {@link Text} primitive
 * plus the role helpers ({@link Lede}, {@link Eyebrow}, {@link Description}, {@link Strong},
 * {@link Caption}, {@link Label}, {@link Code}). Each block renders a live sample so screens
 * have one canonical reference for picking the right typography role.
 */
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
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
  Eyebrow,
  Label,
  Lede,
  Strong,
  Text,
} from "../../components/Typography";
import { useTheme } from "../../components/use-theme";

/**
 * Row data for one typography example -- extends {@link ExampleBlockProps} with a stable React `key`.
 */
type TypographyRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `typography`.
 */
export default function TypographyScreen() {
  const theme = useTheme();
  // Tile that intentionally flips the surrounding scheme so the `invert` demo
  // has a surface where the default `Text` would be unreadable -- which is
  // exactly what the `surfaceInverse` token represents.
  const flippedBg = theme.surfaceInverse;
  const flippedBorder = theme.borderHandle;

  const baseRows: TypographyRow[] = useMemo(
    () => [
      {
        key: "text",
        name: "Text",
        summary: (
          <Description>
            Themed primitive: applies a black or white foreground from the
            active color scheme so labels stay legible on the default app
            surface. Forwards every prop from React Native&apos;s{" "}
            <Code>Text</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Text>Body copy...</Text>`}</Code>
          </Caption>
        ),
        samples: (
          <Text>The quick brown fox jumps over the lazy dog.</Text>
        ),
      },
      {
        key: "text-invert",
        name: "Text invert",
        summary: (
          <Description>
            Pass <Code>invert</Code> when the surface flips the scheme
            (e.g. a light tile in dark mode). The foreground swaps so the
            copy stays readable.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Text invert>...</Text>`}</Code>
          </Caption>
        ),
        samples: (
          <View
            style={[
              styles.flippedTile,
              { backgroundColor: flippedBg, borderColor: flippedBorder },
            ]}
          >
            <Text invert>Inverted text on a flipped tile.</Text>
          </View>
        ),
      },
    ],
    [flippedBg, flippedBorder],
  );

  const roleRows: TypographyRow[] = useMemo(() => {
    /** Wraps a role sample so it spans the example row, keeping wrapping copy readable. */
    const stretchSample = (child: ReactNode) => (
      <View style={styles.stretchSample}>{child}</View>
    );

    return [
      {
        key: "lede",
        name: "Lede",
        summary: (
          <Description>
            Opening paragraph at the top of a <Code>Page</Code>: slightly
            larger and softened. Used once per screen.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Lede>Intro paragraph...</Lede>`}</Code>
          </Caption>
        ),
        samples: stretchSample(
          <Lede>
            This is what a lede paragraph looks like on a UI Kit screen.
          </Lede>,
        ),
      },
      {
        key: "eyebrow",
        name: "Eyebrow",
        summary: (
          <Description>
            Small uppercase label rendered above a section or a list (e.g.
            {" "}<Code>Examples</Code> above a row of{" "}
            <Code>DisclosureCard</Code>).
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Eyebrow>Section</Eyebrow>`}</Code>
          </Caption>
        ),
        samples: <Eyebrow>Section eyebrow</Eyebrow>,
      },
      {
        key: "description",
        name: "Description",
        summary: (
          <Description>
            Muted body paragraph used for component descriptions and prose
            blocks &mdash; slightly smaller than the base <Code>Text</Code>{" "}
            and dimmed.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Description>Body paragraph...</Description>`}</Code>
          </Caption>
        ),
        samples: stretchSample(
          <Description>
            Description copy &mdash; used to explain a sample or carry other
            component prose.
          </Description>,
        ),
      },
      {
        key: "strong",
        name: "Strong",
        summary: (
          <Description>
            Inline bold emphasis for a phrase inside a{" "}
            <Code>Description</Code> &mdash; HTML{" "}
            <Code>&lt;strong&gt;</Code> analog.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Description>... <Strong>word</Strong> ...</Description>`}</Code>
          </Caption>
        ),
        samples: stretchSample(
          <Description>
            This <Strong>highlights</Strong> a key phrase mid-sentence.
          </Description>,
        ),
      },
      {
        key: "caption",
        name: "Caption",
        summary: (
          <Description>
            Small secondary line under a <Code>Description</Code> &mdash;
            usage / API notes. Pass <Code>follow</Code> to stack a second
            caption with breathing room.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Caption>...</Caption>  <Caption follow>...</Caption>`}</Code>
          </Caption>
        ),
        samples: stretchSample(
          <>
            <Caption>
              <Label>API: </Label>
              <Code>{`accessibilityHint="..."`}</Code>
            </Caption>
            <Caption follow>
              <Label>Module: </Label>
              <Code>components/card/DisclosureCard.tsx</Code>
            </Caption>
          </>,
        ),
      },
      {
        key: "label",
        name: "Label",
        summary: (
          <Description>
            Bold inline tag at the start of a <Code>Caption</Code> &mdash;
            e.g. <Code>API:</Code>, <Code>Module:</Code>,{" "}
            <Code>Layout:</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Caption><Label>API: </Label>...</Caption>`}</Code>
          </Caption>
        ),
        samples: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Logo size="md" />`}</Code>
          </Caption>
        ),
      },
      {
        key: "code",
        name: "Code",
        summary: (
          <Description>
            Inline monospace span for code, prop names, and short snippets
            &mdash; HTML <Code>&lt;code&gt;</Code> analog.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Code>variant="primary"</Code>`}</Code>
          </Caption>
        ),
        samples: stretchSample(
          <Description>
            Use <Code>variant=&quot;primary&quot;</Code> for the main action.
          </Description>,
        ),
      },
    ];
  }, []);

  return (
    <Page>
      <Lede>
        Every screen renders text through one of these helpers in{" "}
        <Code>Typography.tsx</Code>. The base <Code>Text</Code> applies the
        active foreground color; the role helpers pick a size, weight, and
        opacity for a specific job so screens don&apos;t repeat style
        references.
      </Lede>

      <Section
        title="Base"
        subtitle="Themed primitive that backs every role helper below."
      >
        {baseRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === baseRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Roles"
        subtitle="Each helper fixes a typography role -- use them instead of inline styles."
      >
        {roleRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === roleRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  flippedTile: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  // Stretch a sample horizontally inside the wrapping example row so wrapping copy
  // (Lede / Description / Caption stacks) gets the full line length.
  stretchSample: {
    flexBasis: "100%",
    width: "100%",
  },
});
