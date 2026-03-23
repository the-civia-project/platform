import { describe, expect, it } from "vitest";
import {
  generateSuggestedHandle,
  handleAdjectives,
  handleAnimals,
  HANDLE_SEGMENT,
  SUGGESTED_HANDLE,
  supportedCountriesAlpha2,
} from "./index";

describe("supportedCountriesAlpha2", () => {
  it("lists 27 EU countries", () => {
    expect(supportedCountriesAlpha2.alpha2).toHaveLength(27);
    expect(supportedCountriesAlpha2.alpha2).toContain("DE");
  });
});

describe("handle word lists", () => {
  it("has 1000 adjectives and animals with valid segments", () => {
    expect(handleAdjectives).toHaveLength(1000);
    expect(handleAnimals).toHaveLength(1000);
    for (const word of [...handleAdjectives, ...handleAnimals]) {
      expect(word).toMatch(HANDLE_SEGMENT);
    }
  });

  it("has no duplicate adjectives or animals", () => {
    expect(new Set(handleAdjectives).size).toBe(handleAdjectives.length);
    expect(new Set(handleAnimals).size).toBe(handleAnimals.length);
  });

  it(
    "all adjective.animal.1234 combinations fit in 64 characters",
    () => {
    for (const adjective of handleAdjectives) {
      for (const animal of handleAnimals) {
        const handle = `@${adjective}.${animal}.1234`;
        expect(handle.length).toBeLessThanOrEqual(64);
      }
    }
  },
    60_000,
  );
});

describe("generateSuggestedHandle", () => {
  it("matches suggested handle shape and length", () => {
    const handle = generateSuggestedHandle();
    expect(handle).toMatch(SUGGESTED_HANDLE);
    expect(handle.length).toBeLessThanOrEqual(64);
    expect(handle.startsWith("@")).toBe(true);
  });
});
