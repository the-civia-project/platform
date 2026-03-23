/**
 * Pure selection helpers for {@link "./ToggleButton".ToggleButton}. Kept
 * framework-free so single- vs multi-select press rules stay pinned by tests.
 */

/**
 * Builds the initial selected slug set from `defaultValue` and the first
 * option slug (single-select fallback only).
 */
export function createInitialSelection(
  multiple: boolean,
  defaultValue: string | readonly string[] | undefined,
  firstSlug: string | undefined,
): Set<string> {
  if (multiple) {
    if (defaultValue === undefined) {
      return new Set();
    }
    if (typeof defaultValue === "string") {
      return new Set([defaultValue]);
    }
    return new Set(defaultValue);
  }

  const slug = typeof defaultValue === "string" ? defaultValue : firstSlug;
  return slug ? new Set([slug]) : new Set();
}

/**
 * Normalises a controlled `value` prop into a slug set.
 */
export function valueToSelectionSet(
  multiple: boolean,
  value: string | readonly string[] | undefined,
): Set<string> {
  if (value === undefined) {
    return new Set();
  }
  if (multiple) {
    return new Set(typeof value === "string" ? [value] : value);
  }
  return typeof value === "string" ? new Set([value]) : new Set();
}

/**
 * Resolves the next selection after a cell press. Returns `null` when the
 * selection is unchanged (single-select re-press on the active cell).
 */
export function nextSelectionOnPress(
  multiple: boolean,
  selected: ReadonlySet<string>,
  slug: string,
): Set<string> | null {
  if (!multiple) {
    if (selected.has(slug)) {
      return null;
    }
    return new Set([slug]);
  }

  const next = new Set(selected);
  if (next.has(slug)) {
    next.delete(slug);
  } else {
    next.add(slug);
  }
  return next;
}

/**
 * Serialises a selection set for {@link ToggleButtonProps.onChange} in
 * multi-select mode (stable slug order follows `options` order).
 */
export function selectionToSlugArray(
  selected: ReadonlySet<string>,
  optionSlugs: readonly string[],
): string[] {
  return optionSlugs.filter((slug) => selected.has(slug));
}
