import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "../../components/card";
import { TextInput } from "../../components/Input";
import { Section } from "../../components/Section";
import { Caption, Text } from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import { webFocusOutlineStyle } from "../web-focus-outline";
import { HOME_NEWS, HOME_TRENDING } from "./home-aside-data";
import { TrendingTopicRow } from "./TrendingTopicRow";

export function HomeAside() {
  const theme = useTheme();
  const [query, setQuery] = useState("");

  return (
    <View
      style={[
        styles.aside,
        { borderLeftColor: theme.borderDefault },
      ]}
    >
      <TextInput
        type="search"
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search The Civia Platform"
      />

      <Section title="Trending" level="eyebrow">
        <Card>
          <View style={styles.list}>
            {HOME_TRENDING.map((topic) => (
              <TrendingTopicRow key={topic.id} topic={topic} />
            ))}
          </View>
        </Card>
      </Section>

      <Section title="News" level="eyebrow">
        <Card>
          <View style={styles.list}>
            {HOME_NEWS.map((item) => (
              <Pressable
                key={item.headline}
                accessibilityRole="button"
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.newsRow,
                  webFocusOutlineStyle(),
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.newsHeadline}>{item.headline}</Text>
                <Caption follow>{item.source}</Caption>
              </Pressable>
            ))}
          </View>
        </Card>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  aside: {
    width: 300,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  list: {
    gap: 8,
  },
  newsRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  newsHeadline: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  rowPressed: {
    opacity: 0.85,
  },
});
