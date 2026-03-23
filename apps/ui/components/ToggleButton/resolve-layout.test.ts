/**
 * Tests for {@link "./resolve-layout"}, the pure grid + corner-radius
 * helpers behind {@link "./ToggleButton".ToggleButton}.
 */
import { describe, expect, it } from "vitest";
import { BUTTON_BORDER_RADIUS_PX } from "../Button/metrics";
import {
  getColumnsPerRow,
  resolveBaseCornerRadius,
  resolveCornerRadii,
  type ToggleButtonCellPosition,
} from "./resolve-layout";

describe("resolveBaseCornerRadius", () => {
  it("matches Button shell radius", () => {
    expect(resolveBaseCornerRadius()).toBe(BUTTON_BORDER_RADIUS_PX);
  });
});

describe("getColumnsPerRow", () => {
  it("returns 0 when there are no options", () => {
    expect(getColumnsPerRow(3, 0)).toBe(0);
  });

  it("never returns more columns than there are options", () => {
    expect(getColumnsPerRow(4, 2)).toBe(2);
    expect(getColumnsPerRow(3, 1)).toBe(1);
  });

  it("caps columns at maxColumnsPerRow", () => {
    expect(getColumnsPerRow(4, 10)).toBe(4);
    expect(getColumnsPerRow(3, 10)).toBe(3);
    expect(getColumnsPerRow(2, 10)).toBe(2);
    expect(getColumnsPerRow(1, 10)).toBe(1);
  });
});

describe("resolveCornerRadii", () => {
  const base = BUTTON_BORDER_RADIUS_PX;

  it("rounds all four corners for a single-cell grid", () => {
    const position: ToggleButtonCellPosition = {
      rowIndex: 0,
      columnIndex: 0,
      rowCount: 1,
      columnCount: 1,
    };
    expect(resolveCornerRadii(position)).toEqual({
      borderTopLeftRadius: base,
      borderTopRightRadius: base,
      borderBottomLeftRadius: base,
      borderBottomRightRadius: base,
    });
  });

  it("rounds only the outer corners in a single-row, multi-column grid", () => {
    const rowCount = 1;
    const columnCount = 3;

    expect(
      resolveCornerRadii({
        rowIndex: 0,
        columnIndex: 0,
        rowCount,
        columnCount,
      }),
    ).toEqual({
      borderTopLeftRadius: base,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: base,
      borderBottomRightRadius: 0,
    });
    expect(
      resolveCornerRadii({
        rowIndex: 0,
        columnIndex: 1,
        rowCount,
        columnCount,
      }),
    ).toEqual({
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    });
    expect(
      resolveCornerRadii({
        rowIndex: 0,
        columnIndex: 2,
        rowCount,
        columnCount,
      }),
    ).toEqual({
      borderTopLeftRadius: 0,
      borderTopRightRadius: base,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: base,
    });
  });

  it("keeps all corners square for interior rows in a multi-row grid", () => {
    expect(
      resolveCornerRadii({
        rowIndex: 1,
        columnIndex: 1,
        rowCount: 3,
        columnCount: 3,
      }),
    ).toEqual({
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  it("does not throw when given an out-of-range position", () => {
    expect(() =>
      resolveCornerRadii({
        rowIndex: -1,
        columnIndex: -1,
        rowCount: 0,
        columnCount: 0,
      }),
    ).not.toThrow();
  });
});
