/**
 * Titled grouping inside a {@link Page}: a heading (default) or small uppercase eyebrow,
 * an optional subtitle, then arbitrary children (typically a list of example blocks or
 * other content).
 */
import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./Typography";

/**
 * Visual prominence of the section title.
 * - `"heading"` (default): larger non-uppercase title -- the standard for kit demo pages
 *   where each section needs to read as a top-level grouping.
 * - `"eyebrow"`: small uppercase label; opt in when a section should feel like a quiet
 *   sub-label rather than a heading.
 */
export type SectionLevel = "heading" | "eyebrow";

/**
 * Props for {@link Section}.
 */
export type SectionProps = PropsWithChildren<{
  /** Heading text shown above the section content. */
  title: string;
  /** Optional one-line description rendered between title and children. */
  subtitle?: string;
  /**
   * Visual prominence of the title.
   * @defaultValue "heading"
   */
  level?: SectionLevel;
}>;

/**
 * Renders the section header (title + optional subtitle) followed by `children`.
 *
 * @param props - {@link SectionProps}
 */
export function Section({
  title,
  subtitle,
  level = "heading",
  children,
}: SectionProps) {
  return (
    <View style={styles.section}>
      <Text
        style={level === "heading" ? styles.titleHeading : styles.titleEyebrow}
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  titleEyebrow: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 8,
  },
  titleHeading: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
    marginBottom: 12,
  },
});
