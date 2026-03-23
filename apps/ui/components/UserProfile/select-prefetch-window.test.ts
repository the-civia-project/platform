import { describe, expect, it } from "vitest";
import {
  selectPrefetchAroundVisible,
  selectPrefetchWindow,
} from "./select-prefetch-window";

describe("selectPrefetchWindow", () => {
  it("returns an empty array for zero count", () => {
    expect(selectPrefetchWindow(["a", "b"], 0, 0)).toEqual([]);
  });

  it("clamps the start index and length to the array", () => {
    expect(selectPrefetchWindow(["a", "b", "c"], 2, 5)).toEqual(["c"]);
  });

  it("de-duplicates within the window", () => {
    expect(selectPrefetchWindow(["a", "a", "b"], 0, 3)).toEqual(["a", "b"]);
  });
});

describe("selectPrefetchAroundVisible", () => {
  it("prefetches behind and ahead of the visible index", () => {
    expect(
      selectPrefetchAroundVisible(["a", "b", "c", "d", "e"], 2, 1, 1),
    ).toEqual(["b", "c", "d"]);
  });
});
