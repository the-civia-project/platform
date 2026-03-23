/**
 * Verdict-badge palette surface for
 * {@link "./FactCheck".FactCheck}: the React Native shell around
 * the pure {@link resolveFactCheckBadgeSurface} lookup. This file
 * owns the hook (`useFactCheckBadgeSurface`); the pure verdict
 * table lives in `./resolve-surface` so it can be unit-tested in
 * Node without dragging in React Native.
 *
 * Co-located with the component so a change to one verdict tier
 * stays a single-file edit.
 */
import { useMemo } from "react";
import {
  DEFAULT_VERDICT_LABELS,
  resolveFactCheckBadgeSurface,
  type FactCheckBadgeSurface,
  type FactCheckVerdict,
} from "./resolve-surface";
import { useTheme } from "../../use-theme";

export {
  DEFAULT_VERDICT_LABELS,
  resolveFactCheckBadgeSurface,
  type FactCheckBadgeSurface,
  type FactCheckVerdict,
};

/**
 * Derives fill, foreground, and border for the requested verdict tier using the
 * active {@link Theme} from {@link useTheme}.
 *
 * @param verdict - {@link FactCheckVerdict} to resolve.
 * @returns {@link FactCheckBadgeSurface} for styling the badge
 *   pill and its inner label.
 */
export function useFactCheckBadgeSurface(
  verdict: FactCheckVerdict,
): FactCheckBadgeSurface {
  const theme = useTheme();

  return useMemo(
    () => resolveFactCheckBadgeSurface(verdict, theme),
    [verdict, theme],
  );
}
