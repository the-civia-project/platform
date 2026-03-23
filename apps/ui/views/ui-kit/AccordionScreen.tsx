/**
 * UI Kit screen for the {@link Accordion} primitive -- the expand / collapse
 * disclosure that backs every {@link ExampleBlock}'s description slot. Each
 * block walks through one facet of the API: the default collapsed shape,
 * `defaultExpanded` for prose blocks that should start open, custom labels
 * for non-English / non-prose use, and the `onToggle` callback for analytics
 * or persistence hooks.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Accordion } from "../../components/Accordion";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Strong,
  Text,
} from "../../components/Typography";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/** Row data with a stable React `key`, used to render the Accordion section. */
type DemoRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `accordion`.
 */
export default function AccordionScreen() {
  // The `onToggle` demo persists the most recent state to the row so visitors
  // can see the callback firing. Lifted to component scope (rather than into
  // the `useMemo`'d row factory) so the value participates in re-renders.
  const [lastEvent, setLastEvent] = useState<"opened" | "closed" | null>(null);

  const rows: DemoRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "default",
        summary: (
          <Description>
            Out of the box: a one-line summary, a "Show more" toggle, and a
            hidden body. Tap the toggle to expand; the surrounding view's
            height eases between states.
          </Description>
        ),
        description: (
          <Description>
            The accordion is uncontrolled -- it owns the expanded flag
            internally and flips it on each press. Children are not mounted
            while collapsed, so a long expandable body costs nothing in
            layout until the visitor opts in. <Code>LayoutAnimation</Code>{" "}
            handles the height transition (no <Code>react-native-reanimated</Code>{" "}
            dependency), and the toggle row stays anchored under whatever is
            currently rendered so the press target doesn't jump mid-content.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Accordion summary={<Description>One-liner...</Description>}>{<Description>Rest...</Description>}</Accordion>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Accordion
              summary={
                <Description>
                  The summary lives outside the accordion's collapse boundary,
                  so it stays visible whether the body is open or closed.
                </Description>
              }
            >
              <Description>
                The body sits between the summary and the toggle. It's a
                regular React Native subtree -- pass any composition you
                like, not just <Code>Description</Code>.
              </Description>
            </Accordion>
          </View>
        ),
      },
      {
        key: "default-expanded",
        name: "defaultExpanded",
        summary: (
          <Description>
            Pass <Code>defaultExpanded</Code> to start in the open state --
            useful when the body is the screen's primary content and the
            collapse is just an opt-out for visitors who want a tighter scan.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Accordion defaultExpanded summary={...}>{...}</Accordion>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Accordion
              defaultExpanded
              summary={
                <Description>
                  This one starts expanded -- tap "Show less" to collapse.
                </Description>
              }
            >
              <Description>
                The body is mounted on first render, so any side-effect hooks
                inside the children fire on mount even before the visitor
                interacts with the toggle.
              </Description>
            </Accordion>
          </View>
        ),
      },
      {
        key: "custom-labels",
        name: "expandLabel / collapseLabel",
        summary: (
          <Description>
            Override the toggle copy with <Code>expandLabel</Code> and{" "}
            <Code>collapseLabel</Code>. Use for localised UIs or for
            content-specific affordances (<Code>"Show stack trace"</Code>,{" "}
            <Code>"See raw payload"</Code>) where the default <Strong>Show more</Strong>{" "}
            reads as generic.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Accordion expandLabel="Show details" collapseLabel="Hide details" summary={...}>{...}</Accordion>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Accordion
              expandLabel="Show details"
              collapseLabel="Hide details"
              summary={
                <Description>
                  Request failed with <Code>500 Internal Server Error</Code>.
                </Description>
              }
            >
              <Description>
                The upstream service timed out after 30s while waiting for
                the database. Retrying typically succeeds. If the error
                persists, surface the request id (in the response headers)
                to support.
              </Description>
            </Accordion>
          </View>
        ),
      },
      {
        key: "on-toggle",
        name: "onToggle",
        summary: (
          <Description>
            Pass <Code>onToggle</Code> to observe the disclosure -- analytics,
            logging, persistence across navigations. The accordion still owns
            the state; this callback is informational, not a way to control
            it from outside.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Accordion onToggle={(expanded) => log("accordion", expanded)} summary={...}>{...}</Accordion>`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <Accordion
              onToggle={(expanded) =>
                setLastEvent(expanded ? "opened" : "closed")
              }
              summary={
                <Description>
                  Toggle the row below; the line under it records the last
                  event.
                </Description>
              }
            >
              <Description>
                Useful for surfacing read receipts -- mark a tip as
                acknowledged once the user opens it, or persist the last
                expanded state so the next visit picks up where they left
                off.
              </Description>
            </Accordion>
            <View style={styles.eventLine}>
              <Caption>
                <Label>Last event: </Label>
                <Text style={styles.eventValue}>{lastEvent ?? "(none)"}</Text>
              </Caption>
            </View>
          </View>
        ),
      },
    ],
    [lastEvent],
  );

  return (
    <Page>
      <Lede>
        <Code>Accordion</Code> is the kit's expand / collapse disclosure -- an
        always-visible <Code>summary</Code> slot above an opt-in body, with
        an animated "Show more / Show less" toggle. Uncontrolled by default:
        it owns the expanded flag internally and flips it on each press;{" "}
        <Code>defaultExpanded</Code> seeds the initial state, and an optional{" "}
        <Code>onToggle</Code> surfaces the change to a parent that wants to
        log or persist it. The toggle row stays anchored under whatever is
        currently rendered (Reddit / Slack pattern) so the press target
        doesn't jump mid-content, and the body is conditionally mounted, so
        a long expandable section costs nothing in layout until the visitor
        opts in. Chromeless by design -- drop it inside a <Code>Card</Code>{" "}
        for a framed treatment, or stand alone for inline disclosures inside
        a longer prose block. Animations run on{" "}
        <Code>LayoutAnimation.configureNext</Code>, so no{" "}
        <Code>react-native-reanimated</Code> dependency.
      </Lede>

      <Section
        title="Accordion"
        subtitle="Summary slot, collapsible body, animated toggle row."
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
  /**
   * Stretches the sample to the full row width -- accordions are flow-level
   * content and read best at the page width, mirroring the wrapper pattern
   * other prose-heavy screens (LayoutScreen, TypographyScreen) reach for.
   */
  stretch: {
    flexBasis: "100%",
    width: "100%",
  },
  /**
   * Small read-out under the {@link onToggle} accordion so the visitor can see
   * the callback firing live. Indented to align with the summary's leading
   * edge rather than the accordion frame.
   */
  eventLine: {
    marginTop: 12,
  },
  eventValue: {
    fontWeight: "600",
  },
});
