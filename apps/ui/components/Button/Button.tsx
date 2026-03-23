/**
 * Pill-shaped `TouchableOpacity` with several visual variants and a disabled state.
 * Labels use React Native `Text` with explicit `color` for contrast on colored backgrounds.
 * When `disabled`, the whole control is dimmed with opacity and presses are ignored.
 *
 * Variants and the variant→color resolution live in `./surface` and are shared with
 * {@link IconButton} so the two controls stay in sync.
 */
import { type PropsWithChildren } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import {
  BUTTON_BORDER_RADIUS_PX,
  BUTTON_LABEL_FONT_SIZE_PX,
  BUTTON_LABEL_LINE_HEIGHT_PX,
  BUTTON_PADDING_HORIZONTAL_PX,
  BUTTON_PADDING_VERTICAL_PX,
} from "./metrics";
import {
  DISABLED_OPACITY,
  useButtonSurface,
  type ButtonVariant,
} from "./surface";

/**
 * Public props for the default-exported {@link Button}.
 */
export type ButtonProps = {
  /** Handler invoked on press; not called when `disabled` is true. */
  onPress?: () => void;
  /**
   * Which {@link ButtonVariant} to render.
   * @defaultValue `"simple"`
   */
  variant?: ButtonVariant;
  /**
   * When true, lowers opacity and disables press handling.
   * @defaultValue false
   */
  disabled?: boolean;
};

/**
 * Renders a labeled action with optional variant and disabled handling.
 *
 * @param props - {@link ButtonProps}
 * @param props.children - Label string (or text nodes) shown inside the button.
 */
export default function Button({
  children,
  onPress,
  variant = "simple",
  disabled = false,
}: PropsWithChildren<ButtonProps>) {
  const surface = useButtonSurface(variant);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        webFocusOutlineStyle(),
        {
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
      <Text
        style={[
          styles.label,
          // Tighter vertical metrics on Android (font padding / alignment).
          Platform.OS === "android" && styles.labelAndroid,
          {
            color: surface.color,
            textDecorationLine: surface.textDecorationLine ?? "none",
          },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BUTTON_BORDER_RADIUS_PX,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL_PX,
    paddingVertical: BUTTON_PADDING_VERTICAL_PX,
  },
  buttonDisabled: {
    opacity: DISABLED_OPACITY,
  },
  label: {
    fontSize: BUTTON_LABEL_FONT_SIZE_PX,
    lineHeight: BUTTON_LABEL_LINE_HEIGHT_PX,
    textAlign: "center",
  },
  labelAndroid: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
