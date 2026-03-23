/**
 * Pressable disclosure row built on {@link Card}: initial tile, title, description, chevron.
 */
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { Card } from "./Card";
import { Text } from "../Typography";
import { useTheme } from "../use-theme";

/**
 * Props for {@link DisclosureCard}: pressable row with initial tile, title stack, and chevron.
 */
export type DisclosureCardProps = {
  /**
   * One character shown in the leading rounded square (typically the section initial).
   */
  initial: string;
  /** Primary heading for the row. Truncated to one line. */
  title: string;
  /**
   * Supporting copy displayed under the title. Capped at two lines (with an
   * ellipsis on longer copy). The text column reserves a fixed two-line block
   * and vertically centers its contents, so every card in a {@link Cluster}
   * lines up at the same height and a short description still reads centered
   * against the avatar and chevron rather than top-anchored.
   */
  description: string;
  /** Invoked when the user activates the card (tap / accessibility). */
  onPress: () => void;
  /**
   * Optional screen reader hint after the default role/name.
   * @defaultValue `Opens ${title} examples`
   */
  accessibilityHint?: string;
};

/**
 * Pressable disclosure row -- {@link Card} with body-only layout (horizontal row inside `children`)
 * terminated by a trailing chevron (`>`) indicating that pressing the card drills deeper.
 *
 * @param props - {@link DisclosureCardProps}
 */
export function DisclosureCard({
  initial,
  title,
  description,
  onPress,
  accessibilityHint = `Opens ${title} examples`,
}: DisclosureCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardCell,
        webFocusOutlineStyle(),
        pressed && styles.pressableActive,
      ]}
    >
      <Card header={null} footer={null}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: theme.surfaceWell }]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            {/*
              Title + description form a single vertical block centered inside
              {@link styles.textColumn} (see its `minHeight` + `justifyContent`).
              `numberOfLines={2}` caps long descriptions with an ellipsis; the
              column's reserved height + center justification mean a one-line
              description renders mid-column rather than top-anchored, keeping
              every card in a {@link Cluster} the same height *and* visually
              balanced against the avatar/chevron.
            */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
          <ChevronRight
            size={22}
            strokeWidth={2}
            color={theme.fg}
            style={styles.chevron}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableActive: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardCell: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
    // Reserves the worst-case height (1-line title + 4px gap + 2 description
    // lines at lineHeight 20) so every card in a {@link Cluster} ends up the
    // same size regardless of description length. Paired with `justifyContent:
    // "center"` so a short description doesn't leave the title + description
    // block top-anchored against the avatar -- instead it floats centered in
    // the row, lining up visually with the avatar and chevron.
    minHeight: 66,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.68,
  },
  chevron: {
    opacity: 0.5,
    marginLeft: 4,
  },
});
