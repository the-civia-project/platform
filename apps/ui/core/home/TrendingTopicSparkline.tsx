import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  buildSingleSeriesAreaPath,
  buildSingleSeriesPath,
} from "./trending-chart-path";

const ROW_CHART_HEIGHT = 72;

type TrendingTopicSparklineProps = {
  values: readonly number[];
  strokeColor: string;
  fillColor: string;
};

export function TrendingTopicSparkline({
  values,
  strokeColor,
  fillColor,
}: TrendingTopicSparklineProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const { areaPath, linePath } = useMemo(() => {
    if (width <= 0) {
      return { areaPath: "", linePath: "" };
    }
    return {
      areaPath: buildSingleSeriesAreaPath(values, width, ROW_CHART_HEIGHT),
      linePath: buildSingleSeriesPath(values, width, ROW_CHART_HEIGHT),
    };
  }, [values, width]);

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && linePath ? (
        <Svg width={width} height={ROW_CHART_HEIGHT}>
          <Path d={areaPath} fill={fillColor} />
          <Path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
});
