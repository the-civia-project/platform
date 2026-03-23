/**
 * Pressable topic row on a {@link Card}: leading initial tile, title, description,
 * and a check (or empty ring) on the right. For multi-select pickers where each
 * option needs more copy than a pill or checklist row.
 */
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { Card } from "../card/Card";
import { Text } from "../Typography";
import { useTheme } from "../use-theme";

/**
 * Props for {@link SelectableTopicCard}.
 */
export type SelectableTopicCardProps = {
  /** One character in the leading square tile. */
  initial: string;
  /** Primary line. */
  title: string;
  /** Supporting copy (up to two lines). */
  description: string;
  /** Whether this option is in the current selection. */
  selected: boolean;
  /** Invoked when the row is pressed (typically toggles selection). */
  onPress: () => void;
  /**
   * Screen-reader hint after the default role/name.
   * @defaultValue Derived from `selected`
   */
  accessibilityHint?: string;
};

/**
 * Single selectable topic row — {@link DisclosureCard} shape with selection chrome.
 */
export function SelectableTopicCard({
  initial,
  title,
  description,
  selected,
  onPress,
  accessibilityHint = selected
    ? "Tap to remove from selection"
    : "Tap to add to selection",
}: SelectableTopicCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        webFocusOutlineStyle(),
        pressed && styles.pressed,
      ]}
    >
      <Card header={null} footer={null}>
        <View
          style={[
            styles.row,
            selected && {
              borderColor: theme.primary,
              backgroundColor: `${theme.primary}12`,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.surfaceWell }]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          </View>
          {selected ? (
            <Check size={22} color={theme.primary} strokeWidth={2} />
          ) : (
            <View style={[styles.emptyCheck, { borderColor: theme.borderHandle }]} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: "700",
    opacity: 0.85,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.68,
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 4,
  },
});
