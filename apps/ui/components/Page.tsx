/**
 * Generic scrolling page shell: a flex root containing a vertical `ScrollView` with the standard
 * content padding. Reusable for any documentation, settings, or list screen -- not demo-specific.
 */
import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Wraps `children` in a flex root + scrollable content area with kit-standard padding.
 *
 * @param props.children - Page sections (intro, {@link Section}, lists, etc.).
 */
export function Page({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
