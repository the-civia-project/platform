/**
 * Inline metadata segments separated by middle dots (·). Used in post
 * tile footers and archetype datelines.
 */
import type { ReactNode } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link MetaLine}.
 */
export type MetaLineProps = {
  /** Ordered segments; falsy entries are skipped. */
  segments: readonly (string | ReactNode | null | undefined)[];
  /**
   * Muted 12px footer style vs 13px inline meta.
   * @defaultValue `"inline"`
   */
  tone?: "inline" | "footer";
};

/**
 * Renders dot-separated metadata on one wrapping row.
 */
export function MetaLine({ segments, tone = "inline" }: MetaLineProps) {
  const theme = useTheme();
  const items = segments.filter(
    (segment): segment is string | ReactNode =>
      segment != null && segment !== "",
  );
  if (items.length === 0) {
    return null;
  }

  const textStyle =
    tone === "footer" ? styles.footerText : styles.inlineText;

  return (
    <View style={styles.root}>
      {items.map((segment, index) => (
        <View key={index} style={styles.piece}>
          {index > 0 ? (
            <RNText style={[styles.sep, { color: theme.fgMuted }]}>
              {"\u00B7"}
            </RNText>
          ) : null}
          {typeof segment === "string" ? (
            <RNText
              style={[textStyle, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {segment}
            </RNText>
          ) : (
            segment
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  piece: {
    flexDirection: "row",
    alignItems: "center",
  },
  sep: {
    fontSize: 12,
    paddingHorizontal: 4,
  },
  inlineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
