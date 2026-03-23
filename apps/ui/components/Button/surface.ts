/**
 * Variant palette surface for {@link Button} and {@link IconButton}: the React Native
 * shell around the pure {@link resolveButtonSurface} lookup. This file owns the
 * hook (`useButtonSurface`) and the shared disabled-state opacity; the pure variant
 * table lives in `./resolve-surface` so it can be unit-tested in Node without
 * dragging in React Native.
 *
 * Co-located here so a change to one variant updates both controls automatically.
 */
import { useMemo } from "react";
import {
  resolveButtonSurface,
  type ButtonSurface,
  type ButtonVariant,
} from "./resolve-surface";
import { useTheme } from "../use-theme";

export {
  resolveButtonSurface,
  type ButtonSurface,
  type ButtonVariant,
};

/**
 * Opacity applied to the entire touchable when `disabled` (palette stays the same underneath).
 * Shared so {@link Button} and {@link IconButton} dim identically in toolbars.
 */
export const DISABLED_OPACITY = 0.45;

/**
 * Derives fill, foreground color, and border for the requested variant using the
 * active {@link Theme} from {@link useTheme}.
 *
 * Thin shell around {@link resolveButtonSurface}: memoises on `variant` and the
 * resolved theme bag. All palette logic lives in the pure resolver.
 *
 * @param variant - {@link ButtonVariant} to resolve.
 * @returns {@link ButtonSurface} for styling the touchable and inner label/icon.
 */
export function useButtonSurface(variant: ButtonVariant): ButtonSurface {
  const theme = useTheme();

  return useMemo(
    () => resolveButtonSurface(variant, theme),
    [variant, theme],
  );
}
