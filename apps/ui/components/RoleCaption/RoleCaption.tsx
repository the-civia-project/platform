/**
 * Muted capacity / role line above structured civic records ("as mayor",
 * "as ward delegate").
 */
import { StyleSheet, Text as RNText } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link RoleCaption}.
 */
export type RoleCaptionProps = {
  /** Capacity copy. */
  children: string;
  /**
   * Italic emphasis (vote records).
   * @defaultValue false
   */
  italic?: boolean;
};

/**
 * Renders a single-line role caption.
 */
export function RoleCaption({ children, italic = false }: RoleCaptionProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[
        styles.text,
        italic && styles.italic,
        { color: theme.fgMuted },
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 16,
  },
  italic: {
    fontStyle: "italic",
  },
});
