/**
 * Pure verdict-badge palette for {@link "./FactCheck".FactCheck}.
 * Owns the {@link FactCheckVerdict} union, the resolved
 * {@link FactCheckBadgeSurface} shape, and the function that maps a
 * verdict + {@link Theme} to its rendered fill / foreground /
 * border.
 *
 * Intentionally framework-free: no React, no React Native, no hooks.
 * The stateful wrapper {@link "./surface".useFactCheckBadgeSurface}
 * lives in `./surface` and composes this function with {@link useTheme}.
 * Tests pass a {@link Theme} from {@link "../../theme".resolveTheme}.
 *
 * Verdict → token mapping reads from the passed {@link Theme}. The same five
 * verdicts the {@link "../Post".FactCheckMedia.factCheck.verdict} field accepts
 * round-trip through this resolver verbatim.
 */
import type { Theme } from "../../theme";

/**
 * Verdict tier carried by a {@link "../Post".FactCheckMedia} tile.
 * The five canonical levels every fact-check authority worth the
 * name converges on, in descending order of confidence:
 *
 * - `true` -- claim is supported by the evidence as stated.
 * - `mostly-true` -- core of the claim is supported but a detail
 *   misleads, omits, or overstates.
 * - `misleading` -- claim leans on a fact but uses framing,
 *   context, or omission to imply a falsehood.
 * - `false` -- claim is contradicted by the evidence.
 * - `unverifiable` -- evidence is missing, contested, or
 *   inconclusive; the checker is not in a position to assign one
 *   of the four substantive verdicts.
 *
 * The kit ships {@link DEFAULT_VERDICT_LABELS} alongside the union
 * for the common case where the caller hasn't translated the
 * labels yet.
 */
export type FactCheckVerdict =
  | "true"
  | "mostly-true"
  | "misleading"
  | "false"
  | "unverifiable";

/**
 * Resolved colours for one {@link FactCheckVerdict}. Spread directly into a React Native
 * {@link "react-native".StyleSheet} object on the badge surface;
 * the kit does not paint any other chrome on the badge beyond
 * these tokens.
 */
export type FactCheckBadgeSurface = {
  /** Background fill behind the verdict label. */
  backgroundColor: string;
  /** Verdict-label foreground colour. */
  color: string;
  /** Border width in logical pixels (`0` when the verdict has no stroke). */
  borderWidth: number;
  /** Border colour (ignored when `borderWidth` is 0). */
  borderColor: string;
};

/**
 * Default human-readable label per verdict. Exported as a frozen
 * record so consumers can read straight off the bag without having
 * to remember the casing convention; product code that wants
 * localised labels should pass its own table to
 * {@link "./FactCheck".FactCheck} via
 * {@link "./FactCheck".FactCheckProps.verdictLabels}.
 */
export const DEFAULT_VERDICT_LABELS: Readonly<
  Record<FactCheckVerdict, string>
> = Object.freeze({
  true: "True",
  "mostly-true": "Mostly true",
  misleading: "Misleading",
  false: "False",
  unverifiable: "Unverified",
});

const NO_BORDER = { borderWidth: 0, borderColor: "transparent" } as const;

/**
 * Maps a verdict + {@link Theme} to its resolved badge surface.
 * Pure: no React, no platform APIs. Pass a bag from {@link useTheme} or
 * {@link "../../theme".resolveTheme}.
 *
 * @param verdict - {@link FactCheckVerdict} to resolve.
 * @param theme - Resolved palette.
 * @returns A fresh {@link FactCheckBadgeSurface}; the result is
 *   safe to spread into a StyleSheet object without aliasing
 *   concerns.
 */
export function resolveFactCheckBadgeSurface(
  verdict: FactCheckVerdict,
  theme: Theme,
): FactCheckBadgeSurface {
  const t = theme;

  if (verdict === "true") {
    return { backgroundColor: t.success, color: t.onSuccess, ...NO_BORDER };
  }

  if (verdict === "false") {
    return { backgroundColor: t.danger, color: t.onDanger, ...NO_BORDER };
  }

  if (verdict === "mostly-true") {
    return {
      backgroundColor: "transparent",
      color: t.success,
      borderWidth: 1,
      borderColor: t.success,
    };
  }

  if (verdict === "misleading") {
    return {
      backgroundColor: "transparent",
      color: t.fgEmphasis,
      borderWidth: 1,
      borderColor: t.borderEmphasis,
    };
  }

  return {
    backgroundColor: "transparent",
    color: t.fgMuted,
    borderWidth: 1,
    borderColor: t.borderDefault,
  };
}
