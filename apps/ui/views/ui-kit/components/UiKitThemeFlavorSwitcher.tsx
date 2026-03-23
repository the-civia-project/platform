/**
 * Compact theme-flavour picker for the UI Kit stack {@link "../UiKit".default}
 * header. Delegates to {@link "../../../core/theme/ThemeFlavorSwitcher"}.
 */
import { ThemeFlavorSwitcher } from "../../../core/theme/ThemeFlavorSwitcher";
import { StyleSheet, View } from "react-native";

export function UiKitThemeFlavorSwitcher() {
  return (
    <View style={styles.wrap}>
      <ThemeFlavorSwitcher width={168} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 8,
    justifyContent: "center",
  },
});
