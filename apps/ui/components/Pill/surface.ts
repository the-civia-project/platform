/**
 * Variant palette for {@link Pill}: action variants delegate to
 * {@link "../Button/surface".useButtonSurface}; `muted` uses
 * {@link resolvePillMutedSurface}.
 */
import { useMemo } from "react";
import { useButtonSurface } from "../Button/surface";
import type { ButtonSurface } from "../Button/resolve-surface";
import { useTheme } from "../use-theme";
import {
  resolvePillMutedSurface,
  type PillMutedSurface,
} from "./resolve-surface";

/**
 * Visual style for {@link Pill}.
 *
 * - `ghost` -- transparent fill with emphasis border; default for unselected
 *   pressable pills.
 * - `primary` -- brand fill; selected pressable pills and explicit emphasis.
 * - `muted` -- recessed mono badge (e.g. "Optional"); not used with `onPress`.
 */
export type PillVariant = "ghost" | "primary" | "muted";

export { resolvePillMutedSurface, type PillMutedSurface };

/**
 * Resolves the `muted` badge surface for the active theme.
 */
export function usePillMutedSurface(): PillMutedSurface {
  const theme = useTheme();
  return useMemo(() => resolvePillMutedSurface(theme), [theme]);
}

/**
 * Resolves an action pill surface via the shared button palette.
 */
export function usePillActionSurface(
  variant: "ghost" | "primary",
): ButtonSurface {
  return useButtonSurface(variant);
}
