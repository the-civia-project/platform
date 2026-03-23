import { StyleSheet, View } from "react-native";
import { Select } from "../../components/Select";
import type { ThemeFlavor } from "../../components/use-theme";
import { useThemeFlavor } from "../../components/use-theme";

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeFlavor; label: string }> = [
  { value: "gazette", label: "Gazette" },
  { value: "matrix", label: "Matrix" },
  { value: "pulse", label: "Pulse" },
  { value: "ember", label: "Ember" },
];

type ThemeFlavorSwitcherProps = {
  /**
   * Width of the select trigger in the header row.
   * @defaultValue 140
   */
  width?: number;
};

export function ThemeFlavorSwitcher({ width = 140 }: ThemeFlavorSwitcherProps) {
  const { flavor, setFlavor } = useThemeFlavor();

  return (
    <View style={[styles.wrap, { width }]}>
      <Select<ThemeFlavor>
        size="xs"
        options={THEME_OPTIONS}
        value={flavor}
        onChange={setFlavor}
        placeholder="Theme"
        search={false}
        sheetTitle="Theme"
        accessibilityLabel="Colour theme"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
  },
});
