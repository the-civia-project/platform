import { describe, expect, it } from "vitest";
import {
  createInitialSelection,
  nextSelectionOnPress,
  selectionToSlugArray,
  valueToSelectionSet,
} from "./toggle-selection";

describe("createInitialSelection", () => {
  it("single-select falls back to the first option slug", () => {
    expect(
      Array.from(createInitialSelection(false, undefined, "a")),
    ).toEqual(["a"]);
  });

  it("multi-select starts empty when defaultValue is omitted", () => {
    expect(
      Array.from(createInitialSelection(true, undefined, "a")),
    ).toEqual([]);
  });

  it("multi-select honours a default slug array", () => {
    expect(
      Array.from(createInitialSelection(true, ["b", "c"], "a")),
    ).toEqual(["b", "c"]);
  });
});

describe("nextSelectionOnPress", () => {
  it("single-select ignores a re-press on the active cell", () => {
    expect(nextSelectionOnPress(false, new Set(["a"]), "a")).toBeNull();
  });

  it("single-select replaces the active cell", () => {
    expect(
      Array.from(nextSelectionOnPress(false, new Set(["a"]), "b")!),
    ).toEqual(["b"]);
  });

  it("multi-select toggles membership", () => {
    const selected = new Set(["a"]);
    expect(
      Array.from(nextSelectionOnPress(true, selected, "b")!),
    ).toEqual(["a", "b"]);
    expect(
      Array.from(nextSelectionOnPress(true, new Set(["a", "b"]), "a")!),
    ).toEqual(["b"]);
  });
});

describe("valueToSelectionSet", () => {
  it("normalises a controlled multi value", () => {
    expect(
      Array.from(valueToSelectionSet(true, ["x", "y"])),
    ).toEqual(["x", "y"]);
  });
});

describe("selectionToSlugArray", () => {
  it("returns slugs in option order", () => {
    expect(
      selectionToSlugArray(new Set(["c", "a"]), ["a", "b", "c"]),
    ).toEqual(["a", "c"]);
  });
});
