/**
 * Multi-select helpers for string-id controlled values (used by
 * {@link "../Pill"}, {@link "../SelectablePillGroup"}, {@link "../SelectableChecklist"}, and
 * {@link "../SelectableTopicList"}).
 */

/** Toggles `id` membership in a readonly string selection. */
export function toggleStringInSelection(
  selection: readonly string[],
  id: string,
): readonly string[] {
  const next = new Set(selection);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return [...next];
}

/** Whether `id` is in the controlled selection. */
export function isStringInSelection(
  selection: readonly string[],
  id: string,
): boolean {
  return selection.includes(id);
}
