/**
 * Displays the bundled brand PNG at a fixed square size chosen from named presets.
 * Uses `contentFit="contain"` so the asset keeps aspect ratio inside the box.
 */
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

/**
 * Ordered list of keys accepted by {@link LogoSize}; useful for demos and iteration.
 */
export const LOGO_SIZE_NAMES = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * Preset side length for {@link Logo}: `xs` 16, `sm` 32, `md` 48, `lg` 64, `xl` 128 (logical px).
 */
export type LogoSize = (typeof LOGO_SIZE_NAMES)[number];

/**
 * Props for the default-exported {@link Logo}.
 */
type LogoProps = {
  /** Which preset dimensions from {@link LOGO_SIZE_NAMES} to apply. */
  size: LogoSize;
};

/**
 * Renders the app logo at the requested preset dimension.
 *
 * @param props - {@link LogoProps}
 */
export default function Logo({ size }: LogoProps) {
  return (
    <Image
      source={require("../assets/logo.png")}
      style={styles[size]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  xs: {
    width: 16,
    height: 16,
  },
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 48,
    height: 48,
  },
  lg: {
    width: 64,
    height: 64,
  },
  xl: {
    width: 128,
    height: 128,
  },
});
