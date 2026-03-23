/**
 * Barrel for the kit `Select` family: a TextInput-chrome trigger opens a
 * {@link Drawer} list; long lists pick up fuzzy search via
 * {@link rankSelectOptionsByFuzzyQuery}. Trigger scaling presets live in
 * {@link SELECT_TRIGGER_METRICS_PX}.
 */
export {
  Select,
  SELECT_SEARCH_THRESHOLD,
  type SelectProps,
} from "./Select";
export {
  SELECT_SIZE_NAMES,
  SELECT_TRIGGER_METRICS_PX,
  SELECT_TRIGGER_MIN_HEIGHT_PX,
  type SelectSize,
  type SelectTriggerMetricsPx,
} from "./metrics";
export type { SelectOption } from "./types";
export {
  defaultSelectSearchHaystack,
  fuzzyScore,
  rankSelectOptionsByFuzzyQuery,
} from "./fuzzy-match";
