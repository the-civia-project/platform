/**
 * Barrel for the {@link ToggleButton} segmented control. Re-exports the
 * component, its public props, and layout helpers. Variant types come from
 * {@link "../Button"} so the two controls stay on the same palette.
 */
export {
  default,
  ToggleButton,
  type ToggleButtonOption,
  type ToggleButtonProps,
  type ToggleButtonPropsMultiple,
  type ToggleButtonPropsSingle,
} from "./ToggleButton";
export {
  resolveToggleCellSurface,
  resolveToggleInactiveVariant,
  resolveToggleSelectedVariant,
} from "./resolve-cell-surface";
export {
  getColumnsPerRow,
  resolveBaseCornerRadius,
  type ToggleButtonCornerRadii,
} from "./resolve-layout";
