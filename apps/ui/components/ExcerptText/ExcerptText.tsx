/**
 * Muted supporting copy under a structured tile title (ask, pitch, dek, …).
 */
import { StyleSheet, Text as RNText } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link ExcerptText}.
 */
export type ExcerptTextProps = {
  /** Body copy. */
  children: string;
  /**
   * Line clamp.
   * @defaultValue 3
   */
  lines?: 2 | 3 | 4;
};

/**
 * Renders a clamped muted excerpt paragraph.
 */
export function ExcerptText({ children, lines = 3 }: ExcerptTextProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[styles.text, { color: theme.fgMuted }]}
      numberOfLines={lines}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
