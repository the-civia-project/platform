import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { useTheme } from "../../components/use-theme";
import { webFocusOutlineStyle } from "../web-focus-outline";
import { HOME_FEED_TABS, type HomeFeedTabId } from "./home-feed-tabs";

type HomeFeedTabsProps = {
  activeTabId: HomeFeedTabId;
  onTabPress: (id: HomeFeedTabId) => void;
};

export function HomeFeedTabs({ activeTabId, onTabPress }: HomeFeedTabsProps) {
  const theme = useTheme();
  const [tablistWidth, setTablistWidth] = useState(0);
  const cellWidth =
    HOME_FEED_TABS.length > 0 ? tablistWidth / HOME_FEED_TABS.length : 0;

  const underlineXRef = useRef<Animated.Value | null>(null);
  if (underlineXRef.current === null) {
    underlineXRef.current = new Animated.Value(0);
  }
  const underlineX = underlineXRef.current;
  const hasMeasuredRef = useRef(false);

  useEffect(() => {
    if (cellWidth <= 0) return;
    const activeIndex = Math.max(
      0,
      HOME_FEED_TABS.findIndex((tab) => tab.id === activeTabId),
    );
    const target = activeIndex * cellWidth;
    if (!hasMeasuredRef.current) {
      underlineX.setValue(target);
      hasMeasuredRef.current = true;
      return;
    }
    Animated.spring(underlineX, {
      toValue: target,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }, [activeTabId, cellWidth, underlineX]);

  const onTablistLayout = useCallback((event: LayoutChangeEvent) => {
    setTablistWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View
      style={[styles.tabBar, { borderBottomColor: theme.borderDefault }]}
      accessibilityRole="tablist"
      onLayout={onTablistLayout}
    >
      {HOME_FEED_TABS.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [
              styles.tab,
              webFocusOutlineStyle(),
              pressed && styles.tabPressed,
            ]}
            hitSlop={6}
          >
            <RNText
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
                { color: isActive ? theme.fgEmphasis : theme.fgMuted },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </RNText>
          </Pressable>
        );
      })}
      <Animated.View
        style={[
          styles.tabUnderline,
          {
            backgroundColor: theme.primary,
            width: cellWidth,
            transform: [{ translateX: underlineX }],
          },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tabPressed: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
});
