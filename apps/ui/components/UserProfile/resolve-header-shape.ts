/**
 * Pure resolver for which optional slots in
 * {@link "./UserProfile".default}'s header render at all. The
 * component asks this resolver once per render to convert the seven
 * optional props into eight booleans the JSX uses to decide which
 * sub-trees to mount.
 *
 * Pulled out as a sibling (rather than left as inline `Boolean(prop)`
 * ternaries inside the component body) for the same reason as
 * {@link "./resolve-active-tab"}: the kit's test-pinned "identity-
 * only header" contract -- "with only required props, the header
 * renders identity and nothing else" -- has to survive future
 * refactors, and the cheapest way to enforce that is a Node-side
 * unit test against a pure function.
 *
 * Framework-free: no React, no React Native, no platform APIs. The
 * `ReactNode` typing on the input is the only React touch, and it's
 * structural -- the resolver only ever consults the truthiness of
 * the value, never renders it.
 */
import type { ReactNode } from "react";

/**
 * Booleans the {@link "./UserProfile".default} header consults to
 * decide which optional sub-trees to mount. Every slot defaults to
 * `false`; flipping any one to `true` corresponds to a specific
 * caller prop being set (and, in the case of `hasActionsOverlay` /
 * `hasActionsInline`, the banner's presence routing the action row
 * to one of two positions).
 */
export type UserProfileHeaderShape = {
  /**
   * `true` when the caller passes a {@link UserProfileProps.banner}
   * value. Drives whether the banner image renders at all and, when
   * paired with {@link UserProfileHeaderShape.hasActionsOverlay},
   * whether the action row anchors absolutely to the banner's
   * top-right.
   */
  hasBanner: boolean;
  /**
   * `true` when {@link UserProfileProps.actions} *and*
   * {@link UserProfileProps.banner} are both set. Routes the action
   * row to the absolute overlay slot pinned to the banner.
   */
  hasActionsOverlay: boolean;
  /**
   * `true` when {@link UserProfileProps.actions} is set but
   * {@link UserProfileProps.banner} is not. Routes the action row to
   * the body-level inline slot above the identity stack.
   */
  hasActionsInline: boolean;
  /**
   * `true` when {@link UserProfileProps.handle} is set. Drives the
   * `@handle` line inside the identity stack.
   */
  hasHandleRow: boolean;
  /**
   * `true` when {@link UserProfileProps.flag} *or*
   * {@link UserProfileProps.location} is set. Drives the citizenship
   * + residence row inside the identity stack -- a single inline row
   * carrying the flag icon (when {@link UserProfileProps.flag} is
   * set) and the location label (when
   * {@link UserProfileProps.location} is set), sitting below the
   * `@handle` line. Either slot can independently fill the row;
   * neither does means the row collapses entirely.
   */
  hasFlagRow: boolean;
  /**
   * `true` when {@link UserProfileProps.bio} is a truthy
   * `ReactNode`. Drives the bio paragraph between the identity stack
   * and the meta row.
   */
  hasBio: boolean;
  /**
   * `true` when {@link UserProfileProps.meta} is a non-empty array.
   * Drives the icon + label meta row between bio and stats.
   */
  hasMeta: boolean;
  /**
   * `true` when {@link UserProfileProps.stats} is a non-empty array.
   * Drives the value + label stats row between meta and tabs.
   */
  hasStats: boolean;
  /**
   * `true` when the avatar should overlap the banner's bottom edge.
   * Equivalent to {@link UserProfileHeaderShape.hasBanner} today --
   * the bannerless variant lays the avatar flush at the top of the
   * body instead -- but kept as a separate field so future
   * variations (e.g. a "no overlap" prop override) can flip this
   * without re-deriving from `hasBanner` everywhere.
   */
  avatarOverlaps: boolean;
};

/**
 * Inputs to {@link resolveHeaderShape}. Mirrors the optional slots
 * on {@link UserProfileProps} that influence header rendering, plus
 * the `handle` / `flag` pair that drives the inner rows of the
 * identity stack. Typed as `unknown[]` for the array slots so
 * consumers don't have to import the concrete `UserProfileMeta` /
 * `UserProfileStat` shapes just to ask "is this array non-empty?".
 */
export type ResolveHeaderShapeInput = {
  /** The caller's `banner` prop. */
  banner: { source: string; aspectRatio?: number } | undefined;
  /** The caller's `actions` prop. */
  actions: ReactNode | undefined | null;
  /** The caller's `handle` prop. */
  handle: string | undefined;
  /** The caller's `flag` prop. */
  flag: string | undefined;
  /** The caller's `location` prop. */
  location: string | undefined;
  /** The caller's `bio` prop. */
  bio: ReactNode | undefined | null;
  /** The caller's `meta` array. */
  meta: ReadonlyArray<unknown> | undefined;
  /** The caller's `stats` array. */
  stats: ReadonlyArray<unknown> | undefined;
};

/**
 * Folds the optional props into the boolean slot map the header's
 * JSX consults. The eight returned booleans are mutually consistent
 * (e.g. exactly one of `hasActionsOverlay` / `hasActionsInline` is
 * ever `true` for any given input, and only when `actions` itself is
 * set) so the JSX can rely on the resolver's invariants rather than
 * re-deriving them inline.
 *
 * @param input - The slice of {@link UserProfileProps} the header
 *   depends on.
 * @returns The {@link UserProfileHeaderShape} the header should
 *   render.
 */
export function resolveHeaderShape(
  input: ResolveHeaderShapeInput,
): UserProfileHeaderShape {
  const hasBanner = Boolean(input.banner);
  const hasActions = Boolean(input.actions);
  return {
    hasBanner,
    hasActionsOverlay: hasBanner && hasActions,
    hasActionsInline: !hasBanner && hasActions,
    hasHandleRow: Boolean(input.handle),
    hasFlagRow: Boolean(input.flag) || Boolean(input.location),
    hasBio: Boolean(input.bio),
    hasMeta: Boolean(input.meta && input.meta.length > 0),
    hasStats: Boolean(input.stats && input.stats.length > 0),
    avatarOverlaps: hasBanner,
  };
}
