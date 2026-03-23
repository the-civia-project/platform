/**
 * Themed surface with optional {@link CardProps.header}, {@link CardProps.footer}, and a
 * {@link CardProps.children} body. Pressable navigation rows use `DisclosureCard` in `DisclosureCard.tsx`.
 */
import type { PropsWithChildren, ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useResolvedColorScheme, useTheme } from "../use-theme";

/**
 * Layout props for {@link Card}: optional header and footer slots; main content is {@link CardProps.children}.
 */
export type CardProps = PropsWithChildren<{
  /**
   * Optional content above the body. Omit or pass `null` to hide the header region.
   */
  header?: ReactNode | null;
  /**
   * Optional content below the body. Omit or pass `null` to hide the footer region.
   */
  footer?: ReactNode | null;
}>;

/**
 * Themed container: renders `header`, then `children` (body), then `footer`. Slots are omitted when `null` or `undefined`.
 *
 * @param props - {@link CardProps}
 */
export function Card({ header, footer, children }: CardProps) {
  const theme = useTheme();
  // Shadow opacity / Android elevation depend on the active scheme but aren't
  // Theme tokens; use {@link useResolvedColorScheme} for the binary branch.
  const isDark = useResolvedColorScheme() === "dark";

  const cardShadow =
    Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: isDark ? 0 : 3,
      },
      default: {},
    }) ?? {};

  return (
    <View
      style={[
        styles.surface,
        cardShadow,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.borderDefault,
        },
      ]}
    >
      {header != null ? <View style={styles.headerSlot}>{header}</View> : null}
      <View style={styles.bodySlot}>{children}</View>
      {footer != null ? <View style={styles.footerSlot}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: "100%",
  },
  headerSlot: {
    marginBottom: 12,
  },
  bodySlot: {
    minWidth: 0,
  },
  footerSlot: {
    marginTop: 12,
  },
});
