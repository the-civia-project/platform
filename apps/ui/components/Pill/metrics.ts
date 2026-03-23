/**
 * Shell dimensions for {@link Pill}. Action variants ({@link PillVariant} `ghost`
 * and `primary`) share {@link "../Button/metrics"} so pills align with
 * {@link "../Button".Button}; the `muted` badge variant uses tighter padding.
 */
export {
  BUTTON_BORDER_RADIUS_PX as PILL_ACTION_BORDER_RADIUS_PX,
  BUTTON_LABEL_FONT_SIZE_PX as PILL_ACTION_LABEL_FONT_SIZE_PX,
  BUTTON_LABEL_LINE_HEIGHT_PX as PILL_ACTION_LABEL_LINE_HEIGHT_PX,
  BUTTON_PADDING_HORIZONTAL_PX as PILL_ACTION_PADDING_HORIZONTAL_PX,
  BUTTON_PADDING_VERTICAL_PX as PILL_ACTION_PADDING_VERTICAL_PX,
} from "../Button/metrics";

/** Corner radius for {@link Pill} `muted` badges (fully rounded capsule). */
export const PILL_MUTED_BORDER_RADIUS_PX = 999;

/** Horizontal padding inside a `muted` pill (logical px). */
export const PILL_MUTED_PADDING_HORIZONTAL_PX = 8;

/** Vertical padding inside a `muted` pill (logical px). */
export const PILL_MUTED_PADDING_VERTICAL_PX = 4;

/** Label font size for {@link Pill} `muted` (logical px). */
export const PILL_MUTED_LABEL_FONT_SIZE_PX = 11;

/** Letter spacing for {@link Pill} `muted` (logical px). */
export const PILL_MUTED_LABEL_LETTER_SPACING_PX = 0.4;
