import { describe, expect, it } from "vitest";
import { validateHandle } from "./handle";
import { firstMessage } from "./_test-utils";

describe("validateHandle", () => {
  it("returns a ZodError for an empty string (no longer special-cased)", () => {
    const result = validateHandle("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each([
    "@A", // 2-char minimum: bare @<letter>
    "@A1",
    "@A12",
    "@aria_popescu",
    "@aria.popescu",
    "@aria-popescu",
    "@aria.popescu.dev", // multiple non-consecutive dots OK
    "@aria-popescu-dev", // multiple non-consecutive dashes OK
    "@bsky.app-handle", // mixed (non-adjacent) dots and dashes OK
    "@AriaPopescu",
    "@dev_42",
    "@A" + "b".repeat(62), // 64-char maximum
  ])("returns true for a valid handle: %s", (value) => {
    expect(validateHandle(value)).toBe(true);
  });

  it.each([
    ["@aria..popescu", "consecutive dots are not allowed"],
    ["@aria--popescu", "consecutive dashes are not allowed"],
    ["@aria.-popescu", "mixed adjacent separators are not allowed"],
    ["@aria-.popescu", "mixed adjacent separators are not allowed (other order)"],
    ["@aria.", "trailing dot is not allowed"],
    ["@aria-", "trailing dash is not allowed"],
    ["@_bob", "must start with a letter, not _"],
    ["@9lives", "must start with a digit"],
    ["aria_popescu", "missing @ prefix"],
    ["@", "missing the required leading letter"],
    ["@A" + "b".repeat(63), "above maximum length (65 chars, cap is 64)"],
    ["@aria popescu", "whitespace is not allowed"],
  ])("returns a ZodError for invalid handle %s (%s)", (value) => {
    const result = validateHandle(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });
});
