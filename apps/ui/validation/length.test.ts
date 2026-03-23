import { describe, expect, it } from "vitest";
import { validateLength } from "./length";
import { firstMessage } from "./_test-utils";

describe("validateLength", () => {
  describe("empty string", () => {
    it("passes when no min is set (rule not violated)", () => {
      expect(validateLength("", {})).toBe(true);
      expect(validateLength("", { max: 5 })).toBe(true);
    });

    it("fails when min is set (length 0 < min)", () => {
      expect(validateLength("", { min: 1 })).not.toBe(true);
      expect(validateLength("", { min: 3 })).not.toBe(true);
      expect(validateLength("", { min: 1, max: 10 })).not.toBe(true);
    });
  });

  describe("min only", () => {
    it("rejects values shorter than min", () => {
      expect(firstMessage(validateLength("ab", { min: 3 }))).toBe(
        "Use at least 3 characters.",
      );
    });

    it("accepts values at or above min", () => {
      expect(validateLength("abc", { min: 3 })).toBe(true);
      expect(validateLength("abcd", { min: 3 })).toBe(true);
    });
  });

  describe("max only", () => {
    it("accepts values at or below max", () => {
      expect(validateLength("abcde", { max: 5 })).toBe(true);
      expect(validateLength("a", { max: 5 })).toBe(true);
    });

    it("rejects values longer than max", () => {
      expect(firstMessage(validateLength("abcdef", { max: 5 }))).toBe(
        "Use at most 5 characters.",
      );
    });
  });

  describe("min and max range", () => {
    it("accepts values within the range", () => {
      expect(validateLength("ab", { min: 1, max: 5 })).toBe(true);
      expect(validateLength("abcde", { min: 1, max: 5 })).toBe(true);
    });

    it("rejects values above the range", () => {
      expect(firstMessage(validateLength("abcdef", { min: 1, max: 5 }))).toBe(
        "Use at most 5 characters.",
      );
    });
  });

  describe("exact length (min === max)", () => {
    it("collapses to a single 'Use exactly N characters.' message", () => {
      expect(firstMessage(validateLength("abcde", { min: 6, max: 6 }))).toBe(
        "Use exactly 6 characters.",
      );
      expect(firstMessage(validateLength("abcdefg", { min: 6, max: 6 }))).toBe(
        "Use exactly 6 characters.",
      );
    });

    it("uses the singular form when N === 1", () => {
      expect(firstMessage(validateLength("ab", { min: 1, max: 1 }))).toBe(
        "Use exactly 1 character.",
      );
    });

    it("accepts a value of exactly N characters", () => {
      expect(validateLength("abcdef", { min: 6, max: 6 })).toBe(true);
    });
  });

  describe("no bounds", () => {
    it("treats any non-empty value as valid", () => {
      expect(validateLength("a", {})).toBe(true);
      expect(validateLength("abcdefghijklmnop", {})).toBe(true);
    });
  });
});
