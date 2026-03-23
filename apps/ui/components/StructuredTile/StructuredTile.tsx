/**
 * Hairline-bordered shell for structured post attachments and archetype
 * teasers. Three variants share padding but differ in radius and fill so
 * engagement tiles, record tiles, and pressable teasers read consistently
 * in a mixed feed.
 */
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";
import {
  STRUCTURED_TILE_ATTACHMENT_BORDER_RADIUS_PX,
  STRUCTURED_TILE_ATTACHMENT_GAP_PX,
  STRUCTURED_TILE_PADDING_PX,
  STRUCTURED_TILE_RECORD_BORDER_RADIUS_PX,
  STRUCTURED_TILE_RECORD_GAP_PX,
} from "./metrics";

/**
 * Visual envelope for {@link StructuredTile}.
 */
export type StructuredTileVariant = "attachment" | "record" | "teaser";

/**
 * Props for {@link StructuredTile}.
 */
export type StructuredTileProps = PropsWithChildren<{
  /**
   * `attachment` — 16px radius, transparent fill (Poll, Petition, …).
   * `record` — 12px radius, transparent fill (Endorsement, Disclosure, …).
   * `teaser` — 12px radius, {@link Theme.surfaceCard} fill; optional press.
   * @defaultValue `"attachment"`
   */
  variant?: StructuredTileVariant;
  /**
   * Vertical gap between stacked children.
   * @defaultValue Variant default (10 attachment, 8 record/teaser)
   */
  gap?: number;
  /**
   * When set on `teaser`, wraps the tile in a pressable with opacity feedback.
   */
  onPress?: () => void;
  /**
   * Screen-reader hint for teaser press targets.
   */
  accessibilityHint?: string;
}>;

/**
 * Renders a bordered structured-tile container.
 */
export function StructuredTile({
  children,
  variant = "attachment",
  gap,
  onPress,
  accessibilityHint,
}: StructuredTileProps) {
  const theme = useTheme();
  const borderRadius =
    variant === "attachment"
      ? STRUCTURED_TILE_ATTACHMENT_BORDER_RADIUS_PX
      : STRUCTURED_TILE_RECORD_BORDER_RADIUS_PX;
  const resolvedGap =
    gap ??
    (variant === "attachment"
      ? STRUCTURED_TILE_ATTACHMENT_GAP_PX
      : STRUCTURED_TILE_RECORD_GAP_PX);
  const backgroundColor =
    variant === "teaser" ? theme.surfaceCard : "transparent";

  const shell = (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.borderDefault,
          borderRadius,
          backgroundColor,
          gap: resolvedGap,
          padding: STRUCTURED_TILE_PADDING_PX,
        },
      ]}
    >
      {children}
    </View>
  );

  if (variant === "teaser" && onPress != null) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [
          styles.teaserPressable,
          webFocusOutlineStyle(),
          { opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {shell}
      </Pressable>
    );
  }

  return shell;
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
  },
  teaserPressable: {
    alignSelf: "stretch",
    width: "100%",
  },
});
