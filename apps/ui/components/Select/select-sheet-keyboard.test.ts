import { describe, expect, it } from "vitest";
import {
  clampSelectHighlightIndex,
  initialSelectHighlightIndex,
  moveSelectHighlightIndex,
} from "./select-sheet-keyboard";

describe("initialSelectHighlightIndex", () => {
  it("returns 0 when options exist", () => {
    expect(initialSelectHighlightIndex(3)).toBe(0);
  });

  it("returns -1 when empty", () => {
    expect(initialSelectHighlightIndex(0)).toBe(-1);
  });
});

describe("clampSelectHighlightIndex", () => {
  it("clamps high indices", () => {
    expect(clampSelectHighlightIndex(9, 3)).toBe(2);
  });

  it("clamps negative indices", () => {
    expect(clampSelectHighlightIndex(-2, 3)).toBe(0);
  });

  it("returns -1 for empty lists", () => {
    expect(clampSelectHighlightIndex(0, 0)).toBe(-1);
  });
});

describe("moveSelectHighlightIndex", () => {
  it("steps down without passing the end", () => {
    expect(moveSelectHighlightIndex(0, 1, 3)).toBe(1);
    expect(moveSelectHighlightIndex(2, 1, 3)).toBe(2);
  });

  it("steps up without passing the start", () => {
    expect(moveSelectHighlightIndex(1, -1, 3)).toBe(0);
    expect(moveSelectHighlightIndex(0, -1, 3)).toBe(0);
  });
});
