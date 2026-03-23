/**
 * Pure state-machine resolver for {@link "./UserProfile".default}'s
 * controlled-or-uncontrolled active-tab contract. Framework-free (no
 * React, no React Native) so the rules can be unit-tested in Node and
 * the React component stays thin glue around the resolver.
 *
 * The resolver answers three questions the component asks per
 * lifecycle event:
 *
 * 1. {@link getInitialActiveTabId} -- "what tab should we land on at
 *    mount?" Used to seed the internal state in the uncontrolled
 *    shape; consulted once.
 * 2. {@link resolveActiveTabId} -- "given the current props + internal
 *    state, which tab is active?" Called every render to fold the
 *    controlled prop (when set) over the internal state.
 * 3. {@link computeTabPressOutcome} -- "the user tapped a tab; should
 *    we update internal state and / or fire `onTabChange`?" Encodes
 *    the re-tap (no transition) vs new-tap (transition) rules and
 *    the controlled-vs-uncontrolled split (only the uncontrolled
 *    shape mutates internal state on press).
 *
 * Keeping the three rules side-by-side here -- rather than scattered
 * across the component body -- is what lets the kit's invariants
 * survive future refactors: a regression in the press semantics shows
 * up as one test going red, not a screen full of behavioural drift.
 */

/**
 * Computes the seed for the internal active-tab state used in the
 * uncontrolled shape. Falls back to the first tab's id when
 * {@link UserProfileProps.defaultTabId} is unset, matching the
 * documented "no default = first tab wins" rule.
 *
 * Consulted exactly once -- at mount -- via React's lazy `useState`
 * initialiser. Later renders read the controlled prop (if any) on top
 * of whatever state the press handler has accumulated; the seed never
 * re-runs even if the parent re-renders with a different
 * `defaultTabId`.
 *
 * @param defaultTabId - The caller's `defaultTabId` prop, or
 *   `undefined` when omitted.
 * @param firstTabId - The `id` of the first entry in the caller's
 *   tabs array. Used as the fallback seed.
 * @returns The id the uncontrolled component should land on at mount.
 */
export function getInitialActiveTabId(
  defaultTabId: string | undefined,
  firstTabId: string,
): string {
  return defaultTabId ?? firstTabId;
}

/**
 * Folds the controlled `activeTabId` prop over the internal-state
 * fallback. When the prop is provided (the controlled shape), it
 * always wins -- this is the test-pinned "external state beats
 * internal state" rule. When the prop is `undefined` (the
 * uncontrolled shape), the internal state is returned verbatim.
 *
 * @param activeTabId - The caller's `activeTabId` prop, or
 *   `undefined` when running uncontrolled.
 * @param internalTabId - The component's internal active-tab state,
 *   seeded via {@link getInitialActiveTabId} and updated by
 *   {@link computeTabPressOutcome} outcomes.
 * @returns The id that should be treated as active for this render.
 */
export function resolveActiveTabId(
  activeTabId: string | undefined,
  internalTabId: string,
): string {
  return activeTabId ?? internalTabId;
}

/**
 * Side effects the user-profile should fire in response to one tab
 * press. The component reads the two booleans, applies the matching
 * effects (internal `setInternalTabId(pressedId)` and / or
 * `onTabChange?.(pressedId)`), and always fires
 * `scrollToTop({ animated: true })` regardless of the outcome
 * (re-tapping the active tab is the kit's "jump to top" affordance
 * and lives outside this resolver).
 */
export type TabPressOutcome = {
  /**
   * Whether the component should call its internal `setInternalTabId`
   * setter. `true` only in the uncontrolled shape on a real
   * transition; `false` in the controlled shape (the parent owns the
   * state) and on re-taps of the already-active tab.
   */
  shouldUpdateInternalState: boolean;
  /**
   * Whether the component should call
   * {@link UserProfileProps.onTabChange} with the pressed id. `true`
   * only on real transitions (pressed id differs from the currently-
   * active id); `false` on re-taps so the observer single-fires per
   * transition and the kit's test-pinned "re-tap doesn't observe"
   * rule survives refactors.
   */
  shouldFireOnTabChange: boolean;
};

/**
 * Resolves the outcome for one tab press. Encodes the two press
 * semantics the user-profile pins:
 *
 * - **Re-tap of the active tab** (`pressedId === resolvedTabId`): no
 *   state update and no observer fire. The press handler still calls
 *   `scrollToTop` on the active feed -- the "tap the selected tab to
 *   jump to top" affordance every social client converges on -- but
 *   the state machine treats the press as a no-op transition.
 * - **New tap**: fires the observer regardless of controlled /
 *   uncontrolled, and additionally updates internal state in the
 *   uncontrolled shape (`isControlled === false`). Controlled
 *   parents are expected to push a new `activeTabId` in response to
 *   the observer call.
 *
 * @param pressedId - The id of the tab the user pressed.
 * @param resolvedTabId - The currently-active tab id (the value
 *   {@link resolveActiveTabId} would return this render).
 * @param isControlled - `true` when the caller is driving
 *   `activeTabId`, `false` otherwise. The component decides this by
 *   checking `props.activeTabId !== undefined`.
 * @returns A {@link TabPressOutcome} describing the effects the
 *   component should apply.
 */
export function computeTabPressOutcome(
  pressedId: string,
  resolvedTabId: string,
  isControlled: boolean,
): TabPressOutcome {
  if (pressedId === resolvedTabId) {
    return { shouldUpdateInternalState: false, shouldFireOnTabChange: false };
  }
  return {
    shouldUpdateInternalState: !isControlled,
    shouldFireOnTabChange: true,
  };
}
