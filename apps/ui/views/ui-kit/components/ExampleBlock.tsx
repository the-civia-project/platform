/**
 * One documented example inside a {@link Section}: monospace name, summary line,
 * an optional expandable description body, the usage / API line(s), and a
 * wrapping row of live samples. Adjacent blocks are separated by a hairline
 * divider (suppressed on the last item).
 *
 * The summary always renders flat. When {@link ExampleBlockProps.description}
 * is also passed, the rest of the prose is tucked behind an {@link Accordion}
 * "Show more" toggle so the screen stays compact for visitors who already know
 * what a variant does. Short blocks omit `description` entirely and read as a
 * one-line entry; long blocks split their prose into a sentence-sized summary
 * plus an expandable body.
 */
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Accordion } from "../../../components/Accordion";
import { Text } from "../../../components/Typography";

/**
 * Props for {@link ExampleBlock}.
 */
export type ExampleBlockProps = {
  /** Short identifier (e.g. variant name, prop name); rendered in a monospace label. */
  name: string;
  /**
   * Always-visible one-line summary of what the example shows. Typically a
   * single `<Description>` sentence -- the headline answer to "what is this
   * block about?". Pair with {@link description} when there is more to say.
   */
  summary: ReactNode;
  /**
   * Optional expandable rest of the prose -- rendered behind an
   * {@link Accordion} "Show more" toggle so visitors who already know the
   * variant aren't forced to wade through implementation detail. Omit when
   * the summary is the whole explanation.
   */
  description?: ReactNode;
  /** Usage / API line(s) -- typically `<Caption>` with `<Label>` and `<Code>`. */
  usage: ReactNode;
  /** Live sample(s) -- laid out in a wrapping horizontal row inside the block. */
  samples: ReactNode;
  /**
   * When `true`, removes the bottom divider and trailing margin (use on the final block in a list).
   * @defaultValue false
   */
  isLast?: boolean;
};

/**
 * Renders a single documented example.
 *
 * @param props - {@link ExampleBlockProps}
 */
export function ExampleBlock({
  name,
  summary,
  description,
  usage,
  samples,
  isLast = false,
}: ExampleBlockProps) {
  return (
    <View style={[styles.block, isLast && styles.blockLast]}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.descSlot}>
        {description != null ? (
          <Accordion summary={summary}>{description}</Accordion>
        ) : (
          summary
        )}
      </View>
      <View style={styles.usageSlot}>{usage}</View>
      <View style={styles.sampleRow}>{samples}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 22,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.22)",
  },
  blockLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    marginBottom: 8,
  },
  descSlot: {
    marginBottom: 10,
  },
  usageSlot: {
    marginBottom: 12,
  },
  // The samples row fills the example block's full inline width
  // (`alignSelf: "stretch"`) so any sample that depends on parent-width
  // sizing -- notably `Post`, which is `width: "100%"` end-to-end -- has a
  // definite container to resolve against on web. CSS resolves percentage
  // widths against an ancestor's definite width; `flex-start` would
  // collapse the row to its intrinsic content width and a `width: "100%"`
  // child of a content-sized parent becomes circular and falls back to
  // intrinsic size, which on web shows up as posts that don't fill the
  // section. On native (Yoga) the same chain happens to resolve through
  // the measure pass, masking the bug. Multi-sample rows (buttons, icons,
  // inputs) stay visually unchanged: `flex-direction: row` plus the gap
  // keeps content left-packed and the right side is empty space either
  // way.
  sampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
});
