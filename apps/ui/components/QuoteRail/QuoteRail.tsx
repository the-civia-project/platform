/**
 * Left-rail inset for quoted claims and embed excerpts. Strong emphasis uses
 * a 2px accent border; hairline variant matches repost rails.
 */
import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Border weight for {@link QuoteRail}.
 */
export type QuoteRailEmphasis = "hairline" | "strong";

/**
 * Props for {@link QuoteRail}.
 */
export type QuoteRailProps = PropsWithChildren<{
  /**
   * `strong` — 2px {@link Theme.borderEmphasis} (fact-check claims).
   * `hairline` — default border (embed excerpts).
   * @defaultValue `"strong"`
   */
  emphasis?: QuoteRailEmphasis;
  /** Optional leading glyph column (e.g. {@link Quote} icon). */
  leading?: ReactNode;
}>;

/**
 * Renders children inside a left-bordered inset.
 */
export function QuoteRail({
  children,
  emphasis = "strong",
  leading,
}: QuoteRailProps) {
  const theme = useTheme();
  const borderColor =
    emphasis === "strong" ? theme.borderEmphasis : theme.borderDefault;
  const borderWidth = emphasis === "strong" ? 2 : StyleSheet.hairlineWidth;

  return (
    <View
      style={[
        styles.root,
        {
          borderLeftColor: borderColor,
          borderLeftWidth: borderWidth,
        },
      ]}
    >
      {leading != null ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingLeft: 10,
    gap: 8,
  },
  leading: {
    paddingTop: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
});
