/**
 * Square pressable button with a single icon inside. Shares variant colors with {@link Button}
 * via `./surface`, and adds a small size scale and a rounded/round shape -- same conventions
 * as the `Avatar` component.
 */
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import {
  DISABLED_OPACITY,
  useButtonSurface,
  type ButtonVariant,
} from "./surface";

/**
 * Preset side length for {@link IconButton}: `sm` 32, `md` 40 (default), `lg` 48 (logical px).
 */
export type IconButtonSize = "sm" | "md" | "lg";

/**
 * Outline treatment -- corner radius scaled with the size (`rounded`) or full circle (`round`).
 */
export type IconButtonShape = "rounded" | "round";

/** Logical-pixel side length for each {@link IconButtonSize}. */
const SIZE_TO_DIM_PX: Record<IconButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

/** Pixel size of the inner icon for each {@link IconButtonSize} -- roughly half the box. */
const SIZE_TO_ICON_PX: Record<IconButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Props for the default-exported {@link IconButton}.
 */
export type IconButtonProps = {
  /** Lucide icon component rendered centered inside (e.g. `Heart`, `Plus`, `X`). */
  icon: LucideIcon;
  /** Required screen-reader label -- icon-only buttons have no visible text. */
  accessibilityLabel: string;
  /** Handler invoked on press; ignored when `disabled` is true. */
  onPress?: () => void;
  /**
   * Which {@link ButtonVariant} to render. Defaults to the chrome-less `full-ghost`
   * because icon-only buttons are most commonly used as toolbar/nav affordances
   * (back, close, overflow), where a heavy fill would over-state the action.
   * Promote to `simple`/`primary` when the press is the main action of a screen
   * card, modal footer, or composer.
   * @defaultValue "full-ghost"
   */
  variant?: ButtonVariant;
  /**
   * Square side length.
   * @defaultValue "md"
   */
  size?: IconButtonSize;
  /**
   * Outline treatment -- scaled corners or full circle.
   * @defaultValue "rounded"
   */
  shape?: IconButtonShape;
  /**
   * When true, lowers opacity and disables press handling.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Override the icon's stroke colour. Falls back to the resolved variant foreground
   * (`useButtonSurface(variant).color`) when omitted. Used by parents that need to
   * express a state the variant table doesn't cover -- e.g. a "liked" Heart in a feed
   * action row, where the icon turns red while the chrome stays full-ghost.
   */
  color?: string;
  /**
   * Pairs with {@link color} to switch between two icon treatments:
   * - `false` (default): stroke only -- `color` paints the outline, fill stays `"none"`.
   * - `true`: stroke **and** fill -- both paint with `color`, producing a solid
   *   silhouette. Use for toggled states on icons whose outline and fill read as
   *   distinct visual states (`Heart`, `Star`, `Bookmark`). Avoid on stroke-detailed
   *   icons (`MessageCircle`, `Repeat2`, arrows) whose internals collapse when filled.
   * @defaultValue false
   */
  filled?: boolean;
};

/**
 * Renders a square icon-only action.
 *
 * @param props - {@link IconButtonProps}
 */
export default function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = "full-ghost",
  size = "md",
  shape = "rounded",
  disabled = false,
  color,
  filled = false,
}: IconButtonProps) {
  const surface = useButtonSurface(variant);
  const dim = SIZE_TO_DIM_PX[size];
  const iconSize = SIZE_TO_ICON_PX[size];
  const borderRadius =
    shape === "round" ? dim / 2 : Math.round(dim * 0.25);
  const resolvedColor = color ?? surface.color;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        webFocusOutlineStyle(),
        {
          width: dim,
          height: dim,
          borderRadius,
          backgroundColor: surface.backgroundColor,
          borderWidth: surface.borderWidth,
          borderColor: surface.borderColor,
        },
        disabled && styles.buttonDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.85}
    >
      <Icon
        size={iconSize}
        color={resolvedColor}
        fill={filled ? resolvedColor : "none"}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    // `width`/`height` already match on the inline style, but these two
    // pin the box to a square even when the IconButton lands in a tight
    // `flexDirection: "row"` parent (e.g. Post's footer action row,
    // AttachmentBar). Without them, a flex-shrunk row collapses the box
    // into a rectangle -- and because `shape="round"` sets
    // `borderRadius: dim / 2`, that rectangle renders as an oval rather
    // than a circle.
    aspectRatio: 1,
    flexShrink: 0,
  },
  buttonDisabled: {
    opacity: DISABLED_OPACITY,
  },
});
