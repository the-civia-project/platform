import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Caption, Description, Text } from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import { webFocusOutlineStyle } from "../web-focus-outline";
import type { TrendingTopic } from "./home-aside-data";
import { TrendingTopicSparkline } from "./TrendingTopicSparkline";

type TrendingTopicRowProps = {
  topic: TrendingTopic;
  onPress?: () => void;
};

/** Appends an 8-bit alpha channel to a `#rrggbb` theme token. */
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function TrendingTopicRow({
  topic,
  onPress = () => {},
}: TrendingTopicRowProps) {
  const theme = useTheme();

  const { strokeColor, fillColor } = useMemo(
    () => ({
      strokeColor: withAlpha(theme.primary, "33"),
      fillColor: withAlpha(theme.primary, "0c"),
    }),
    [theme.primary],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${topic.posts}, trending over the last seven days`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        webFocusOutlineStyle(),
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.chartFrame, { borderColor: theme.borderSubtle }]}>
        <TrendingTopicSparkline
          values={topic.trendSeries}
          strokeColor={strokeColor}
          fillColor={fillColor}
        />
        <View style={styles.copy}>
          <Caption>{topic.category}</Caption>
          <Text style={styles.trendTitle}>{topic.title}</Text>
          <Description>{topic.posts}</Description>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    overflow: "hidden",
  },
  rowPressed: {
    opacity: 0.9,
  },
  chartFrame: {
    position: "relative",
    minHeight: 72,
    justifyContent: "flex-end",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  copy: {
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    zIndex: 1,
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
});
