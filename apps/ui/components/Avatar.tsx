/**
 * Displays a remote avatar image at a fixed square preset size, with either rounded corners
 * (scaled to the size) or a full circle. Uses `expo-image` so the URL is cached and decoded
 * off the JS thread. Sits on the active theme's {@link Theme.surfaceInverse} fill (cream on
 * dark, walnut on light) so source images with transparent backgrounds stay legible on
 * either theme.
 */
import { Image } from "expo-image";
import { useTheme } from "./use-theme";

/**
 * Ordered list of keys accepted by {@link AvatarSize}; useful for demos and iteration.
 */
export const AVATAR_SIZE_NAMES = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * Preset side length for {@link Avatar}: `xs` 24, `sm` 32, `md` 48, `lg` 64, `xl` 96 (logical px).
 */
export type AvatarSize = (typeof AVATAR_SIZE_NAMES)[number];

/**
 * Pixel dimension associated with each {@link AvatarSize}; exported for layout math and demos.
 */
export const AVATAR_DIM_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

/**
 * Outline treatment for the avatar -- `rounded` keeps corners with a side-proportional radius,
 * `round` clips to a full circle.
 */
export type AvatarShape = "rounded" | "round";

/**
 * Props for the default-exported {@link Avatar}.
 */
export type AvatarProps = {
  /** Remote image URL displayed inside the avatar. */
  source: string;
  /**
   * Which preset side length to apply.
   * @defaultValue "md"
   */
  size?: AvatarSize;
  /**
   * Outline treatment -- corner radius scaled with the size (`rounded`) or full circle (`round`).
   * @defaultValue "rounded"
   */
  shape?: AvatarShape;
  /** Screen reader label describing the subject (e.g. the person's name). */
  accessibilityLabel: string;
};

/**
 * Renders an avatar image at the requested preset dimension and shape.
 *
 * @param props - {@link AvatarProps}
 */
export default function Avatar({
  source,
  size = "md",
  shape = "rounded",
  accessibilityLabel,
}: AvatarProps) {
  const theme = useTheme();
  const dim = AVATAR_DIM_PX[size];
  const borderRadius =
    shape === "round" ? dim / 2 : Math.round(dim * 0.25);

  return (
    <Image
      source={{ uri: source }}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      style={{
        width: dim,
        height: dim,
        borderRadius,
        backgroundColor: theme.surfaceInverse,
      }}
    />
  );
}
