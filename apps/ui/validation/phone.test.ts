import { describe, expect, it } from "vitest";
import { validatePhone } from "./phone";
import { firstMessage } from "./_test-utils";

describe("validatePhone", () => {
  it("returns a ZodError for an empty string (no longer special-cased)", () => {
    const result = validatePhone("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each([
    "+1 (555) 555-1234",
    "+15555551234",
    "555.555.1234",
    "555-555-1234",
    "(555) 555 1234",
    "5555555", // 7 digits -- ITU minimum
    "+123456789012345", // 15 digits -- E.164 maximum
  ])("accepts a format-lenient phone number: %s", (value) => {
    expect(validatePhone(value)).toBe(true);
  });

  it.each([
    "5555555#1", // 1-digit extension -- minimum
    "555-555-1234#100", // 3-digit extension with hyphen formatting
    "+1 555 555 1234 #5678", // whitespace around # is stripped
    "(555) 555.1234#1", // mixed formatting + ext
    "+15555551234#1234567890", // 10-digit extension -- maximum
  ])("accepts a phone number with #<extension>: %s", (value) => {
    expect(validatePhone(value)).toBe(true);
  });

  it.each([
    "123456", // 6 digits -- below minimum
    "1234567890123456", // 16 digits -- above maximum
    "abc",
    "+abc1234567",
    "+", // plus only
    "++15555551234", // double plus
  ])("rejects: %s", (value) => {
    const result = validatePhone(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each([
    "5555555#", // empty extension after #
    "5555555#12345678901", // 11-digit extension -- above 10-digit cap
    "5555555##1234", // double # not allowed
    "5555555#12#34", // multiple extensions
    "#1234", // extension without a main number
    "5555555#abc", // non-digit extension
  ])("rejects malformed extensions: %s", (value) => {
    const result = validatePhone(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });
});
