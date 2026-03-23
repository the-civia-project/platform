/**
 * Pure layout helpers for {@link "./ToggleButton".ToggleButton}. Framework-free
 * (no React, no React Native) so the grid math and corner-radius rules can be
 * unit-tested in Node and the component stays thin glue around them.
 *
 * Shell dimensions (padding, label rhythm, corner radius) come from
 * {@link "../Button/metrics"} so the control stays aligned with {@link Button}.
 */
import { BUTTON_BORDER_RADIUS_PX } from "../Button/metrics";

/**
 * Corner-radius metadata for one grid cell. Mirrors the subset of the
 * React Native `ViewStyle` border-radius props the component cares
 * about; kept as plain numbers so the resolver stays UI-framework
 * agnostic.
 */
export type ToggleButtonCornerRadii = {
  /** Radius applied to the cell's top-left corner. */
  borderTopLeftRadius: number;
  /** Radius applied to the cell's top-right corner. */
  borderTopRightRadius: number;
  /** Radius applied to the cell's bottom-left corner. */
  borderBottomLeftRadius: number;
  /** Radius applied to the cell's bottom-right corner. */
  borderBottomRightRadius: number;
};

/**
 * Grid position of a single option inside the chunked layout.
 */
export type ToggleButtonCellPosition = {
  /** 0-based row index inside the grid. */
  rowIndex: number;
  /** 0-based column index inside the current row. */
  columnIndex: number;
  /** Total number of rows in the grid. */
  rowCount: number;
  /** Number of cells in the current row. */
  columnCount: number;
};

/**
 * Corner radius shared by the outer envelope and outer grid cells. Matches
 * {@link BUTTON_BORDER_RADIUS_PX} on {@link Button}.
 *
 * @returns Corner radius in logical pixels.
 */
export function resolveBaseCornerRadius(): number {
  return BUTTON_BORDER_RADIUS_PX;
}

/**
 * Given a maximum column count and the total number of options, returns how
 * many columns each full row should render. The last row may be shorter.
 *
 * @param maxColumnsPerRow - Upper bound on columns per row (from props).
 * @param optionCount - Total number of options. When 0, returns 0.
 * @returns Columns per full row; 0 when there are no options.
 */
export function getColumnsPerRow(
  maxColumnsPerRow: number,
  optionCount: number,
): number {
  if (optionCount <= 0 || maxColumnsPerRow <= 0) return 0;
  return Math.min(maxColumnsPerRow, optionCount);
}

/**
 * Computes which outer corners of a given cell should round to produce
 * the kit's pill-shaped outline:
 *
 * - Only the **top row** cells get top radius.
 * - Only the **bottom row** cells get bottom radius.
 * - Within a row, only the **first** and **last** cells get radius;
 *   inner cells stay square so the outline remains continuous.
 *
 * @param position - Row/column metadata for this cell.
 * @returns Corner-radius numbers for this cell only.
 */
export function resolveCornerRadii(
  position: ToggleButtonCellPosition,
): ToggleButtonCornerRadii {
  const baseRadius = resolveBaseCornerRadius();
  const { rowIndex, columnIndex, rowCount, columnCount } = position;

  const isTopRow = rowIndex === 0;
  const isBottomRow = rowIndex === rowCount ? false : rowIndex === rowCount - 1;
  const isFirstColumn = columnIndex === 0;
  const isLastColumn =
    columnIndex === columnCount ? false : columnIndex === columnCount - 1;

  const topLeft = isTopRow && isFirstColumn ? baseRadius : 0;
  const topRight = isTopRow && isLastColumn ? baseRadius : 0;
  const bottomLeft = isBottomRow && isFirstColumn ? baseRadius : 0;
  const bottomRight = isBottomRow && isLastColumn ? baseRadius : 0;

  return {
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomLeftRadius: bottomLeft,
    borderBottomRightRadius: bottomRight,
  };
}
