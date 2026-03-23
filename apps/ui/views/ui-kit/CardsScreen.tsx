/**
 * UI Kit screen for the `Card` family: documents the {@link Card} layout primitive (header / body /
 * footer slots) and the composed {@link DisclosureCard} pressable navigation row.
 */
import { useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Card, DisclosureCard } from "../../components/card";
import { Cluster } from "../../components/Cluster";
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

/**
 * Row data for the Card / DisclosureCard demos -- extends {@link ExampleBlockProps} with a React `key`.
 */
type CardExampleRow = ExampleBlockProps & { key: string };

/**
 * Returns a press handler that surfaces a quick toast-style alert so demo taps are observable.
 */
const tapHandler = (label: string) => () =>
  Alert.alert("UI Kit", `Tapped: ${label}`);

/**
 * Default-exported screen registered with the UI Kit stack as `cards`.
 */
export default function CardsScreen() {
  const primitiveRows: CardExampleRow[] = useMemo(
    () => [
      {
        key: "card-layout",
        name: "header | body | footer",
        summary: (
          <Description>
            <Code>Card</Code> lays out a column: optional{" "}
            <Code>header</Code>, main area from <Code>children</Code>,
            optional <Code>footer</Code>. Omit a slot or pass{" "}
            <Code>null</Code> to hide it &mdash; spacing adjusts only when
            a slot is present.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>
              {`<Card header={<>...</>} footer={<>...</>}>\n  ...body...\n</Card>`}
            </Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Card
              header={<Text style={styles.slotHeader}>Header (JSX)</Text>}
              footer={<Text style={styles.slotFooter}>Footer (JSX)</Text>}
            >
              <Description>Body: any layout you pass as children.</Description>
            </Card>
          </View>
        ),
      },
      {
        key: "card-body-only",
        name: "null slots",
        summary: (
          <Description>
            Pass <Code>header=&#123;null&#125;</Code> and{" "}
            <Code>footer=&#123;null&#125;</Code> (or omit them) when the
            surface is only a body &mdash; used by{" "}
            <Code>DisclosureCard</Code> internally.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>
              {`<Card header={null} footer={null}>\n  ...\n</Card>`}
            </Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Card header={null} footer={null}>
              <Description>
                Body-only surface with the same chrome as other cards.
              </Description>
            </Card>
          </View>
        ),
      },
    ],
    [],
  );

  const disclosureRows: CardExampleRow[] = useMemo(
    () => [
      {
        key: "disclosure-default",
        name: "DisclosureCard",
        summary: (
          <Description>
            Pressable row built on <Code>Card</Code>: initial tile, title,
            description, chevron. Background, border, and shadow live on
            the inner <Code>Card</Code>; press feedback wraps the outside.
          </Description>
        ),
        usage: (
          <View>
            <Caption>
              <Label>Module: </Label>
              <Code>components/card/DisclosureCard.tsx</Code>
            </Caption>
            <Caption follow>
              <Label>API: </Label>
              <Code>
                {`<DisclosureCard initial="S" title="..." description="..." onPress={() => {}} />`}
              </Code>
            </Caption>
          </View>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <DisclosureCard
              initial="S"
              title="Settings"
              description="Account, privacy, notifications, and defaults."
              onPress={tapHandler("Settings")}
            />
          </View>
        ),
      },
      {
        key: "disclosure-wrap",
        name: "row-wrap",
        summary: (
          <Description>
            Place multiple <Code>DisclosureCard</Code> components in a row
            with <Code>flexWrap</Code> and <Code>gap</Code>. Each grows
            from a minimum width up to full width on narrow screens.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>Layout: </Label>
            <Code>
              {`<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>`}
            </Code>
          </Caption>
        ),
        samples: (
          <Cluster style={styles.sampleRowFull}>
            <DisclosureCard
              initial="A"
              title="Appearance"
              description="Theme and display density."
              onPress={tapHandler("Appearance")}
            />
            <DisclosureCard
              initial="N"
              title="Notifications"
              description="Push, email, and in-app alerts."
              onPress={tapHandler("Notifications")}
            />
          </Cluster>
        ),
      },
      {
        key: "disclosure-a11y",
        name: "accessibilityHint",
        summary: (
          <Description>
            Screen readers announce the button role and title. Pass{" "}
            <Code>accessibilityHint</Code> when the default &ldquo;Opens
            &hellip; examples&rdquo; copy does not match your flow.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`accessibilityHint="Opens billing help in Safari"`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <DisclosureCard
              initial="B"
              title="Billing help"
              description="Charges, invoices, and payment methods."
              accessibilityHint="Opens billing help in the browser"
              onPress={tapHandler("Billing help")}
            />
          </View>
        ),
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        <Code>Card</Code> is the themed shell (optional header and footer,
        children as body). <Code>DisclosureCard</Code> composes it into the
        tappable navigation rows on the home screen. Taps on disclosure rows
        fire an alert so you can confirm <Code>onPress</Code> wiring.
      </Lede>

      <Section
        title="Card"
        subtitle="Optional header and footer; main content is children."
      >
        {primitiveRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === primitiveRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="DisclosureCard"
        subtitle="Pressable navigation row -- Card with a horizontal body only and a trailing chevron."
      >
        {disclosureRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === disclosureRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  sampleColumn: {
    width: "100%",
    alignSelf: "stretch",
    gap: 12,
  },
  sampleRowFull: {
    width: "100%",
    alignSelf: "stretch",
  },
  slotHeader: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.85,
  },
  slotFooter: {
    fontSize: 12,
    opacity: 0.55,
  },
});
