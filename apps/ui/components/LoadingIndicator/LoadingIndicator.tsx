/**
 * Themed wrapper around React Native's {@link ActivityIndicator}. Resolves
 * {@link "./theme".Theme.fgMuted} from {@link useTheme} so spinners track light/dark
 * mode and {@link "./theme".ThemeFlavor} without callers passing a `color` prop.
 *
 * Reach for this anywhere the kit shows a wait state (feed footers, auth
 * gates, profile/composer loading). For pull-to-refresh chrome, use
 * `RefreshControl` separately — it is not covered here.
 */
import { ActivityIndicator } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Props for {@link LoadingIndicator}.
 */
export type LoadingIndicatorProps = {
  /**
   * React Native spinner scale. Use `"large"` for full-screen / auth gates;
   * default `"small"` matches feed footers and inline waits.
   * @defaultValue "small"
   */
  size?: "small" | "large";
};

/**
 * Renders a muted foreground spinner tied to the active kit palette.
 *
 * @param props - {@link LoadingIndicatorProps}
 */
export function LoadingIndicator({ size = "small" }: LoadingIndicatorProps) {
  const theme = useTheme();

  return <ActivityIndicator size={size} color={theme.fgMuted} />;
}
