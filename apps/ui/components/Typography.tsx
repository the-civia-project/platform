/**
 * Typography primitives for the app: a themed {@link Text} base plus role-specific helpers
 * (lede, eyebrow, description, code, ...) so screens don't repeat style references.
 */
import type { PropsWithChildren } from "react";
import {
  Platform,
  Text as RNText,
  StyleSheet,
  TextProps as RNTextProps,
} from "react-native";
import { useTheme } from "./use-theme";

/**
 * Props for the {@link Text} primitive. Extends React Native's {@link RNTextProps} with theme behavior.
 */
export type TextProps = RNTextProps & {
  /**
   * When `true`, uses the opposite foreground to the device scheme so text stays legible on
   * surfaces that intentionally flip contrast (e.g. a light card in dark mode).
   * @defaultValue false
   */
  invert?: boolean;
};

/**
 * Themed text primitive. Renders React Native's `Text` with the active theme's
 * body foreground colour ({@link Theme.fg}), or the flipped one
 * ({@link Theme.fgInverse}) when `invert` is set so copy stays legible on
 * surfaces that intentionally flip contrast (e.g. a light card in dark mode).
 *
 * @param props - {@link TextProps}
 */
export function Text({ invert = false, ...rest }: TextProps) {
  const theme = useTheme();
  const color = invert ? theme.fgInverse : theme.fg;

  // Theme foreground is appended after `rest.style`, so the active token wins over caller styles.
  return <RNText {...rest} style={[rest.style, { color }]} />;
}

/**
 * Opening paragraph at the top of a page -- slightly larger and softened body copy.
 *
 * @param props.children - Paragraph copy; may include inline {@link Code} or {@link Strong} spans.
 */
export function Lede({ children }: PropsWithChildren) {
  return <Text style={styles.lede}>{children}</Text>;
}

/**
 * Small uppercase eyebrow rendered above a section or a list (e.g. `"Examples"`).
 *
 * @param props.children - Label copy (typically a short uppercase word).
 */
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

/**
 * Muted body paragraph -- used for component descriptions and prose blocks.
 */
export function Description({ children }: PropsWithChildren) {
  return <Text style={styles.description}>{children}</Text>;
}

/**
 * Inline bold emphasis for a phrase inside a {@link Description} (HTML `<strong>` analog).
 */
export function Strong({ children }: PropsWithChildren) {
  return <Text style={styles.strong}>{children}</Text>;
}

/**
 * Props for {@link Caption}.
 */
export type CaptionProps = PropsWithChildren<{
  /**
   * When `true`, adds a top margin so multiple captions stack with breathing room.
   * @defaultValue false
   */
  follow?: boolean;
}>;

/**
 * Small secondary line of text -- typically a usage / API note under a {@link Description}.
 * Combine with {@link Label} for the leading bold tag and {@link Code} for the snippet body.
 *
 * @param props - {@link CaptionProps}
 */
export function Caption({ children, follow = false }: CaptionProps) {
  return (
    <Text style={[styles.caption, follow && styles.captionFollow]}>
      {children}
    </Text>
  );
}

/**
 * Bold inline tag like `"API:"` / `"Module:"` shown at the start of a {@link Caption}.
 */
export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

/**
 * Inline monospace span for code, prop names, and short snippets (HTML `<code>` analog).
 */
export function Code({ children }: PropsWithChildren) {
  return <Text style={styles.code}>{children}</Text>;
}

/**
 * Platform-resolved monospace font family used by {@link Code} and any kit
 * primitive that needs a console / annotated typographic accent (e.g.
 * {@link "./Hero".Hero}'s eyebrow). Exported so consumers reuse the same
 * Platform.select rather than duplicating the iOS / Android fork.
 */
export const monoFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  lede: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.78,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    opacity: 0.45,
    marginBottom: 12,
    marginLeft: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.72,
  },
  strong: {
    fontWeight: "700",
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.8,
  },
  captionFollow: {
    marginTop: 8,
  },
  label: {
    fontWeight: "600",
    opacity: 0.55,
  },
  code: {
    fontFamily: monoFamily,
    fontSize: 13,
  },
});
