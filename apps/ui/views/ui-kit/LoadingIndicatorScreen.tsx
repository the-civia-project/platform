/**
 * UI Kit screen for {@link LoadingIndicator}. Documents the default small
 * spinner and the large variant used on auth gates and full-screen waits.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LoadingIndicator } from "../../components/LoadingIndicator";
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
} from "../../components/Typography";

type LoadingIndicatorRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `loading-indicator`.
 */
export default function LoadingIndicatorScreen() {
  const rows: LoadingIndicatorRow[] = useMemo(
    () => [
      {
        key: "small",
        name: "small",
        summary: (
          <Description>
            Default scale for feed footers and inline waits. Colour is{" "}
            <Code>theme.fgMuted</Code> from the active palette — no{" "}
            <Code>color</Code> prop on the call site.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<LoadingIndicator />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <LoadingIndicator />
          </View>
        ),
      },
      {
        key: "large",
        name: "large",
        summary: (
          <Description>
            Full-screen and auth-gate waits. Same muted token; tracks light/dark
            and flavor inside the primitive.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<LoadingIndicator size="large" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <LoadingIndicator size="large" />
          </View>
        ),
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        Themed spinner wrapper around React Native&apos;s activity indicator.
        Callers pick a size; the kit supplies muted foreground from the active
        theme.
      </Lede>
      <Section title="Sizes">
        {rows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
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
  sample: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
