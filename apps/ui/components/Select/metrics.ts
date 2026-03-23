/**
 * Layout presets for the closed {@link "./Select".Select} trigger so the pill
 * scales with {@link SelectSize} while staying visually aligned with
 * {@link "../Input/TextInput".TextInput} chrome (shared border radius and surface).
 */

/** Ordered catalogue for demos and layout iteration. */
export const SELECT_SIZE_NAMES = ["xs", "sm", "md"] as const;

/**
 * Trigger scale for {@link Select}.
 */
export type SelectSize = (typeof SELECT_SIZE_NAMES)[number];

/**
 * Per-size geometry for the closed select row (padding, type, chevron).
 */
export type SelectTriggerMetricsPx = {
  /** Minimum height of the trigger pill (logical px). */
  minHeight: number;
  /** Horizontal padding inside the trigger. */
  paddingHorizontal: number;
  /** Vertical padding inside the trigger. */
  paddingVertical: number;
  /** Primary label font size in the trigger. */
  fontSize: number;
  /** Pass-through to the chevron icon's `size` prop. */
  chevronSize: number;
  /** Gap between label and chevron. */
  gap: number;
};

/**
 * Resolved metrics for each {@link SelectSize}. {@link SelectSize} `"md"` matches
 * the historical single-size trigger before `size` existed.
 */
export const SELECT_TRIGGER_METRICS_PX: Record<
  SelectSize,
  SelectTriggerMetricsPx
> = {
  xs: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    chevronSize: 16,
    gap: 6,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    chevronSize: 18,
    gap: 8,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    chevronSize: 20,
    gap: 10,
  },
};

/**
 * Minimum trigger height keyed by {@link SelectSize} — shorthand for layout math
 * and kit demos that only need the vertical rhythm.
 */
export const SELECT_TRIGGER_MIN_HEIGHT_PX: Record<SelectSize, number> = {
  xs: SELECT_TRIGGER_METRICS_PX.xs.minHeight,
  sm: SELECT_TRIGGER_METRICS_PX.sm.minHeight,
  md: SELECT_TRIGGER_METRICS_PX.md.minHeight,
};
