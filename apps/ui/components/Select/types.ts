/**
 * Shared option row shape for the kit `Select` component. Kept in a tiny module so
 * `rankSelectOptionsByFuzzyQuery` (in `./fuzzy-match.ts`) can import the shape without
 * pulling in React Native.
 *
 * @typeParam T - Stored value type. Prefer string/number ids for stable list keys;
 *   for non-primitive values, pass `valueEquals` on `Select`.
 */
export type SelectOption<T = string> = {
  /**
   * Value passed to the select's `onChange` handler when this row is chosen.
   */
  value: T;
  /**
   * Primary line in the closed trigger and in the picker row.
   */
  label: string;
  /**
   * Optional extra text included in fuzzy matching (abbreviations, alternate
   * spellings, metadata) without changing the visible {@link SelectOption.label}.
   */
  searchText?: string;
};
