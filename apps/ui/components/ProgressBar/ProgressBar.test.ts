import { describe, expect, it } from "vitest";

/** Clamps progress ratio the same way {@link ProgressBar} paints fill width. */
function progressRatio(value: number, max: number): number {
  return max > 0 ? Math.min(value / max, 1) : 0;
}

describe("ProgressBar ratio", () => {
  it("clamps fill to 100% when value exceeds max", () => {
    expect(progressRatio(150, 100)).toBe(1);
  });

  it("returns zero when max is zero", () => {
    expect(progressRatio(10, 0)).toBe(0);
  });
});
