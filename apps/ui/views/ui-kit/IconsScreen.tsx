/**
 * UI Kit screen showcasing icons from `lucide-react-native`. Each block documents one of the
 * shared icon props -- `size`, `color`, `strokeWidth`, and `absoluteStrokeWidth` -- with
 * side-by-side variants so the visual effect of each prop is easy to compare.
 */
import { useMemo, type ReactNode } from "react";
import { Bell, Heart, Square, Star } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Strong,
} from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/**
 * Row data for one icon-prop example -- extends {@link ExampleBlockProps} with a React `key`.
 */
type IconPropRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `icons`.
 */
export default function IconsScreen() {
  const theme = useTheme();
  const inkColor = theme.fg;

  const rows: IconPropRow[] = useMemo(() => {
    /** Wraps a sample icon with a small monospace value caption underneath. */
    const valueColumn = (value: string, icon: ReactNode) => (
      <View style={styles.sampleColumn}>
        {icon}
        <Code>{value}</Code>
      </View>
    );

    /** Wraps a pair of icons with a descriptive caption underneath (used by absoluteStrokeWidth). */
    const compareColumn = (caption: string, children: ReactNode) => (
      <View style={styles.compareGroup}>
        <View style={styles.compareRow}>{children}</View>
        <Caption>{caption}</Caption>
      </View>
    );

    return [
      {
        key: "size",
        name: "size",
        summary: (
          <Description>
            Pixel dimension of the rendered SVG square &mdash; width and
            height scale together. Lucide defaults to <Code>24</Code>; use
            a smaller value for inline list iconography and a larger one
            for hero or empty-state imagery.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Bell size={number} />  // default 24`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn("14", <Bell size={14} color={inkColor} />)}
            {valueColumn("18", <Bell size={18} color={inkColor} />)}
            {valueColumn("24", <Bell size={24} color={inkColor} />)}
            {valueColumn("32", <Bell size={32} color={inkColor} />)}
            {valueColumn("48", <Bell size={48} color={inkColor} />)}
          </>
        ),
      },
      {
        key: "color",
        name: "color",
        summary: (
          <Description>
            Stroke colour (and fill, for fill-style icons). Accepts any
            React Native colour string &mdash; named colour, <Code>#hex</Code>,{" "}
            <Code>rgba()</Code>, or a platform token.
          </Description>
        ),
        description: (
          <Description>
            Default is <Code>currentColor</Code>, so pass an explicit colour
            or wrap the icon in a coloured container. Reach for the kit's{" "}
            <Code>useTheme()</Code> tokens (<Code>danger</Code>,{" "}
            <Code>primary</Code>, <Code>success</Code>) for accent colours
            so the icon stays in step with the rest of the palette.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Heart color={theme.danger} />  // or any RN colour string`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn("theme.fg", <Heart size={28} color={theme.fg} />)}
            {valueColumn(
              "theme.danger",
              <Heart size={28} color={theme.danger} />,
            )}
            {valueColumn(
              "theme.primary",
              <Heart size={28} color={theme.primary} />,
            )}
            {valueColumn(
              "theme.success",
              <Heart size={28} color={theme.success} />,
            )}
          </>
        ),
      },
      {
        key: "strokeWidth",
        name: "strokeWidth",
        summary: (
          <Description>
            Width of the SVG stroke inside the icon's 24-unit viewBox.
            Default is <Code>2</Code>; lower values feel lighter (good for
            dense rows), higher values feel chunkier (good for emphasis).
          </Description>
        ),
        description: (
          <Description>
            <Strong>Stroke scales with </Strong>
            <Code>size</Code> by default &mdash; pair with{" "}
            <Code>absoluteStrokeWidth</Code> to lock it in pixels.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Star strokeWidth={1 | 1.5 | 2 | 2.5} />  // default 2`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn(
              "1",
              <Star size={32} strokeWidth={1} color={inkColor} />,
            )}
            {valueColumn(
              "1.5",
              <Star size={32} strokeWidth={1.5} color={inkColor} />,
            )}
            {valueColumn(
              "2",
              <Star size={32} strokeWidth={2} color={inkColor} />,
            )}
            {valueColumn(
              "2.5",
              <Star size={32} strokeWidth={2.5} color={inkColor} />,
            )}
          </>
        ),
      },
      {
        key: "absoluteStrokeWidth",
        name: "absoluteStrokeWidth",
        summary: (
          <Description>
            When <Code>true</Code>, the rendered stroke stays at the
            requested pixel width regardless of <Code>size</Code>.
          </Description>
        ),
        description: (
          <Description>
            Without it, strokes scale with the icon, so a row mixing small
            and large variants ends up visually inconsistent. Reach for it
            when you want a uniform line weight across multiple icon sizes
            on the same screen.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>
              {`<Square strokeWidth={2} absoluteStrokeWidth />  // default false`}
            </Code>
          </Caption>
        ),
        samples: (
          <>
            {compareColumn(
              "default (scales)",
              <>
                <Square size={20} strokeWidth={2} color={inkColor} />
                <Square size={48} strokeWidth={2} color={inkColor} />
              </>,
            )}
            {compareColumn(
              "absoluteStrokeWidth",
              <>
                <Square
                  size={20}
                  strokeWidth={2}
                  absoluteStrokeWidth
                  color={inkColor}
                />
                <Square
                  size={48}
                  strokeWidth={2}
                  absoluteStrokeWidth
                  color={inkColor}
                />
              </>,
            )}
          </>
        ),
      },
    ];
  }, [inkColor, theme.danger, theme.primary, theme.success]);

  return (
    <Page>
      <Lede>
        Icons come from <Code>lucide-react-native</Code>, drawn with{" "}
        <Code>react-native-svg</Code>. Every icon accepts the same four shared
        props &mdash; <Code>size</Code>, <Code>color</Code>, <Code>strokeWidth</Code>,{" "}
        <Code>absoluteStrokeWidth</Code> &mdash; plus any standard SVG attribute.
        Each block below documents one prop with comparable variants.
      </Lede>

      <Section title="Props">
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
  sampleColumn: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  compareGroup: {
    width: 144,
    alignItems: "center",
    gap: 6,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
