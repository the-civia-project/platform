/**
 * Tappable menu row designed for the body of a {@link Drawer}. One row per
 * action -- optional leading {@link LucideIcon}, label, optional description,
 * optional right-side accessory (drill-in chevron or selection check), with a
 * destructive variant for delete/sign-out/block-style actions.
 *
 * Sized to feel right at home in a bottom sheet: 48px minimum hit area,
 * full-width tap target, theme-aware foreground, and a subtle press feedback.
 * Pair multiple rows inside a {@link Drawer} body to build an action-sheet
 * pattern; pair with `accessory="check"` and a single `selected` row to build
 * a single-select picker.
 */
import { Check, ChevronRight, type LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type AccessibilityState,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useResolvedColorScheme, useTheme } from "../use-theme";

/**
 * Right-side affordance hint for a {@link DrawerItem}.
 *
 * - `none` (default) -- nothing on the right; standalone action row.
 * - `chevron` -- drill-in arrow, signalling the row navigates somewhere deeper
 *   (a sub-sheet, a screen, an external URL).
 * - `check` -- selection mark, signalling the row is the currently chosen
 *   option in a single-select group.
 */
export type DrawerItemAccessory = "none" | "chevron" | "check";

/**
 * Props for {@link DrawerItem}.
 */
export type DrawerItemProps = {
  /**
   * Optional Lucide icon rendered to the left of the label. Sized to 20px and
   * stroked at 1.75 to match the rest of the kit's outline icons (Lucide's
   * default 2 is slightly heavy at 20px). Picks up the same foreground as
   * the label, including the destructive treatment.
   */
  icon?: LucideIcon;
  /** Primary row label. Truncated to one line. */
  label: string;
  /** Optional supporting line under the label. Truncated to one line. */
  description?: string;
  /** Press handler -- required because a non-tappable row in a drawer is a bug, not a feature. */
  onPress: () => void;
  /**
   * Right-side affordance -- see {@link DrawerItemAccessory}.
   * @defaultValue "none"
   */
  accessory?: DrawerItemAccessory;
  /**
   * Renders the row in the destructive treatment: red foreground for the
   * icon, label, and accessory. Reserved for irreversible actions
   * (Delete, Sign out, Block, Report) so the colour stays meaningful.
   * @defaultValue false
   */
  destructive?: boolean;
  /**
   * Optional screen-reader override -- defaults to {@link DrawerItemProps.label}.
   * Provide a longer string when the label alone wouldn't make sense out of
   * context (e.g. "Mute" inside a moderation menu would read better as "Mute
   * Aria Popescu").
   */
  accessibilityLabel?: string;
  /**
   * Optional accessibility hint surfaced after the role/label, mirroring
   * {@link DisclosureCard.accessibilityHint}. Use for rows whose effect isn't
   * obvious from the label alone ("Opens settings", "Removes this post from
   * your timeline").
   */
  accessibilityHint?: string;
  /**
   * Keyboard / typeahead highlight in a list (e.g. {@link Select}'s filtered
   * rows). Applies the same pressed-surface fill without requiring a press.
   * @defaultValue false
   */
  highlighted?: boolean;
  /**
   * Optional state merged into the row's accessibility state (e.g.
   * `selected` for keyboard-highlighted picker rows).
   */
  accessibilityState?: AccessibilityState;
};

/**
 * Renders a single drawer row. See {@link DrawerItemProps}.
 *
 * @param props - {@link DrawerItemProps}
 */
export function DrawerItem({
  icon: Icon,
  label,
  description,
  onPress,
  accessory = "none",
  destructive = false,
  accessibilityLabel,
  accessibilityHint,
  highlighted = false,
  accessibilityState,
}: DrawerItemProps) {
  const theme = useTheme();
  // Pressed-state overlay is a "barely there" alpha layer rather than a Theme
  // token; branch on {@link useResolvedColorScheme} for light vs dark tuning.
  const isDark = useResolvedColorScheme() === "dark";
  const pressedBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  // Destructive items take the `danger` accent for label + icon + accessory;
  // everything else uses the body emphasis foreground. The muted tone for
  // description copy and inactive accessories mirrors the rest of the kit.
  const fg = destructive ? theme.danger : theme.fgEmphasis;
  const accessoryColor = destructive ? theme.danger : theme.fgMuted;

  // We render the right-side affordance with the same `LucideIcon` interface
  // the caller's `icon` prop uses, so the same `size` / `color` props apply.
  // `null` skips the slot entirely for `accessory="none"`.
  const Accessory =
    accessory === "chevron"
      ? ChevronRight
      : accessory === "check"
        ? Check
        : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        webFocusOutlineStyle(),
        (pressed || highlighted) && { backgroundColor: pressedBg },
      ]}
    >
      {Icon ? <Icon size={20} color={fg} strokeWidth={1.75} /> : null}
      <View style={styles.textColumn}>
        {/*
          Using React Native's raw `Text` directly (rather than the themed
          {@link Text} from Typography) because the destructive variant needs
          to override the theme foreground, and Typography's `Text` puts the
          theme colour after the caller's style -- meaning it would win. The
          plain `Text` plus an explicit `color` keeps the destructive red
          visible.
        */}
        <RNText
          style={[styles.label, { color: fg }]}
          numberOfLines={1}
        >
          {label}
        </RNText>
        {description ? (
          <RNText
            style={[styles.description, { color: theme.fgMuted }]}
            numberOfLines={1}
          >
            {description}
          </RNText>
        ) : null}
      </View>
      {Accessory ? (
        <Accessory size={18} color={accessoryColor} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /**
   * Full-width row. 48px minimum hit area follows iOS HIG and Material's
   * minimum touch target; the negative-marginless padding keeps text aligned
   * to the drawer's content padding while still giving the press feedback
   * a slightly-extended hit zone.
   */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
