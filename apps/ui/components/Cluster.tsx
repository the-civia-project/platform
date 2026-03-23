/**
 * Cluster layout: a wrapping flex row with a fixed gap. Useful anywhere a row of pills, tags,
 * cards, or other tile-shaped children needs to break onto multiple lines without manual breakpoints.
 *
 * @see https://every-layout.dev/layouts/cluster/
 */
import type { PropsWithChildren } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Props for {@link Cluster}.
 */
export type ClusterProps = PropsWithChildren<{
  /** Optional style override (e.g. to force full width or change spacing). */
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Renders children in a horizontal row that wraps to new lines as needed, with a fixed gap.
 * Each child is responsible for its own sizing (`flexBasis`, intrinsic width, etc.).
 *
 * @param props - {@link ClusterProps}
 */
export function Cluster({ children, style }: ClusterProps) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
