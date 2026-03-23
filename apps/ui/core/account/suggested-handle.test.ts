import { describe, expect, it } from "vitest";
import { generateSuggestedHandle } from "./suggested-handle";
import { validateHandle } from "../../validation/handle";

describe("generateSuggestedHandle", () => {
  it("matches handle format and passes validation", () => {
    const handle = generateSuggestedHandle();
    expect(handle).toMatch(/^@[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[0-9]+$/);
    expect(validateHandle(handle)).toBe(true);
  });
});
