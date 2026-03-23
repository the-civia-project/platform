/**
 * Pure resolver for which {@link ButtonSurface} a {@link "./ToggleButton".ToggleButton}
 * cell should paint. Framework-free so selection rules stay unit-testable in Node.
 *
 * Inactive cells use the group's {@link ButtonVariant} (with small normalisations).
 * Active cells promote to a stronger variant -- usually `primary`, but `simple`,
 * `inverted`, and `danger` groups keep their accent on the selected cell.
 */
import {
  resolveButtonSurface,
  type ButtonSurface,
  type ButtonVariant,
} from "../Button/resolve-surface";
import type { Theme } from "../theme";

/**
 * Variants that do not work as-is in a segmented grid and how they map for
 * the **inactive** cell treatment. `link` drops the underline (no inline
 * hyperlink semantics in a radio row); selection still promotes to `primary`
 * unless the group variant is one of the accent-preserving exceptions.
 */
const TOGGLE_INACTIVE_VARIANT_MAP: Partial<Record<ButtonVariant, ButtonVariant>> =
  {
    link: "full-ghost",
  };

/**
 * Group variants whose **selected** cell keeps the group variant rather than
 * promoting to `primary`.
 */
const TOGGLE_SELECTED_KEEPS_GROUP: ReadonlySet<ButtonVariant> = new Set([
  "simple",
  "inverted",
  "danger",
]);

/**
 * Group variants whose **inactive** cells fall back to `ghost` so the row
 * does not read as N filled pills competing with the selection.
 */
const TOGGLE_INACTIVE_USES_GHOST: ReadonlySet<ButtonVariant> = new Set([
  "primary",
  "simple",
  "danger",
]);

/**
 * Normalises a group {@link ButtonVariant} for inactive cell painting.
 *
 * @param variant - Caller-supplied group variant.
 * @returns Variant passed to {@link resolveButtonSurface} for inactive cells.
 */
export function resolveToggleInactiveVariant(
  variant: ButtonVariant,
): ButtonVariant {
  return TOGGLE_INACTIVE_VARIANT_MAP[variant] ?? variant;
}

/**
 * Resolves which {@link ButtonVariant} the **selected** cell should use.
 *
 * @param variant - Caller-supplied group variant.
 * @returns Variant passed to {@link resolveButtonSurface} for the active cell.
 */
export function resolveToggleSelectedVariant(
  variant: ButtonVariant,
): ButtonVariant {
  if (TOGGLE_SELECTED_KEEPS_GROUP.has(variant)) {
    return variant;
  }
  return "primary";
}

/**
 * Resolves fill, foreground, and border for one toggle cell.
 *
 * @param variant - Group {@link ButtonVariant} from {@link ToggleButtonProps}.
 * @param theme - Resolved palette from {@link useTheme} or {@link "../theme".resolveTheme}.
 * @param selected - Whether this cell is the current selection.
 * @returns {@link ButtonSurface} for the cell shell and label.
 */
export function resolveToggleCellSurface(
  variant: ButtonVariant,
  theme: Theme,
  selected: boolean,
): ButtonSurface {
  if (selected) {
    return resolveButtonSurface(resolveToggleSelectedVariant(variant), theme);
  }

  const inactiveVariant = resolveToggleInactiveVariant(variant);
  if (TOGGLE_INACTIVE_USES_GHOST.has(variant)) {
    return resolveButtonSurface("ghost", theme);
  }

  return resolveButtonSurface(inactiveVariant, theme);
}
