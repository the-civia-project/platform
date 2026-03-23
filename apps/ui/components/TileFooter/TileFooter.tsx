/**
 * Bottom row on engagement tiles: flexible metadata on the left, optional
 * action affordance on the right.
 */
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Props for {@link TileFooter}.
 */
export type TileFooterProps = {
  /** Left column (counts, amounts, icons + labels). */
  meta?: ReactNode;
  /** Right column (typically a {@link "../Button".Button}). */
  action?: ReactNode;
  /**
   * `space-between` when both columns are present; `end` for action-only footers.
   * @defaultValue `"space-between"`
   */
  align?: "space-between" | "end";
};

/**
 * Renders a two-column tile footer.
 */
export function TileFooter({
  meta,
  action,
  align = "space-between",
}: TileFooterProps) {
  if (meta == null && action == null) {
    return null;
  }

  return (
    <View
      style={[
        styles.root,
        align === "end" ? styles.alignEnd : styles.alignBetween,
      ]}
    >
      {meta != null ? <View style={styles.meta}>{meta}</View> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alignBetween: {
    justifyContent: "space-between",
  },
  alignEnd: {
    justifyContent: "flex-end",
  },
  meta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
});
