import { describe, expect, it } from "vitest";
import { isStringInSelection, toggleStringInSelection } from "./string-selection";

describe("string selection", () => {
  it("toggles membership", () => {
    const next = toggleStringInSelection([], "a");
    expect(isStringInSelection(next, "a")).toBe(true);
    const cleared = toggleStringInSelection(next, "a");
    expect(isStringInSelection(cleared, "a")).toBe(false);
  });
});
