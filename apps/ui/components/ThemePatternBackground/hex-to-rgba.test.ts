import { describe, expect, it } from "vitest";
import { hexToRgba } from "./hex-to-rgba";

describe("hexToRgba", () => {
  it("converts six-digit hex to rgba", () => {
    expect(hexToRgba("#1a162e", 0.5)).toBe("rgba(26,22,46,0.5)");
  });

  it("accepts hex without leading hash", () => {
    expect(hexToRgba("ff0000", 1)).toBe("rgba(255,0,0,1)");
  });

  it("returns original string when not parseable", () => {
    expect(hexToRgba("not-a-color", 0.5)).toBe("not-a-color");
  });
});
