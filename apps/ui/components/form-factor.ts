/**
 * Pure form-factor classifier for the kit. Maps the runtime's `Platform.OS`
 * plus a window width to one of three buckets that drive platform-
 * conditional UI:
 *
 * - `"mobile"` -- native React Native (iOS / Android, and any other future
 *   non-web RN target). Touch is the primary input; swipe / pinch / long-
 *   press gestures are first-class. No need for click-based fallback UI.
 * - `"web-mobile"` -- web build (`Platform.OS === "web"`) on a phone-sized
 *   viewport (width <= {@link WEB_MOBILE_MAX_PX}). Touch still works,
 *   gestures still feel natural; the only thing that differs from `"mobile"`
 *   is that the runtime is the DOM rather than RN native. Treat as a phone
 *   for UI decisions: no chevrons on carousels, no hover affordances.
 * - `"web"` -- web build on a non-mobile viewport (width >
 *   {@link WEB_MOBILE_MAX_PX}). Pointer input dominates, swipe is absent or
 *   awkward, and any UI that leans on swipe (carousels, drawers, paged
 *   sheets) needs complementary click affordances -- chevrons over a
 *   carousel, a visible scrollbar, keyboard arrows, etc.
 *
 * Kept framework-free (no React, no React Native) so it can be unit-tested
 * in Node and reused by a future server-render path. The stateful shell that
 * pulls inputs from `Platform.OS` + `Dimensions` and exposes a hook lives in
 * {@link "./use-form-factor"}; consumers in `components/` and `views/` read
 * from there.
 */

/**
 * Form-factor buckets. See the module-level JSDoc for the meaning of each
 * value and the rules around when one applies. Encoded as a union of string
 * literals so consumers can `switch` exhaustively in TypeScript.
 */
export type FormFactor = "mobile" | "web-mobile" | "web";

/**
 * Pixel width at which a web viewport stops being considered "mobile".
 * Aligned with the common 768px tablet boundary -- at or below this width we
 * treat the surface as a phone (touch-first, no chevrons, etc.), above it
 * as a desktop/tablet (pointer-first, chevrons enabled, keyboard nav).
 *
 * Exported so tests can pin against the same constant as the runtime.
 */
export const WEB_MOBILE_MAX_PX = 767;

/**
 * Pure classifier. Maps an OS identifier (the runtime's `Platform.OS`
 * string) plus a window width in CSS pixels to a {@link FormFactor}.
 *
 * Only `"web"` is special-cased; every other OS collapses to `"mobile"`,
 * which deliberately includes any non-web RN target. Future RN platforms
 * (Windows, macOS, tvOS, visionOS) inherit the "touch-or-controller-first"
 * default until a counter-case shows up. The `width` argument is consulted
 * only when `os === "web"`; for non-web platforms callers can pass any
 * value (typically `Dimensions.get("window").width` so the caller doesn't
 * have to special-case the read).
 *
 * @param os - The runtime's `Platform.OS` string.
 * @param width - Window width in CSS pixels (only consulted when web).
 * @returns The resolved {@link FormFactor}.
 */
export function pickFormFactor(os: string, width: number): FormFactor {
  if (os !== "web") return "mobile";
  return width <= WEB_MOBILE_MAX_PX ? "web-mobile" : "web";
}
