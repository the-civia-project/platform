/**
 * Pure surface resolver for the {@link Pill} `muted` badge variant. Action variants
 * (`ghost`, `primary`) reuse {@link "../Button/resolve-surface".resolveButtonSurface}.
 */
import type { Theme } from "../theme";

/**
 * Resolved colors and border for {@link Pill} `muted`.
 */
export type PillMutedSurface = {
  /** Badge fill. */
  backgroundColor: string;
  /** Label color. */
  color: string;
  /** Hairline border width (logical px). */
  borderWidth: number;
  /** Border color. */
  borderColor: string;
};

/**
 * Maps the active {@link Theme} to the recessed chip surface used by `muted` pills.
 *
 * @param theme - Resolved palette (same shape as {@link useTheme} returns).
 */
export function resolvePillMutedSurface(theme: Theme): PillMutedSurface {
  return {
    backgroundColor: theme.surfaceWell,
    color: theme.fgMuted,
    borderWidth: 1,
    borderColor: theme.borderHandle,
  };
}
