import { describe, expect, it } from "vitest";
import { validateEmail } from "./email";
import { firstMessage } from "./_test-utils";

describe("validateEmail", () => {
  it("returns a ZodError for an empty string (no longer special-cased)", () => {
    const result = validateEmail("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each([
    "you@example.com",
    "aria.popescu@example.co.uk",
    "first+tag@sub.example.org",
  ])("returns true for a valid email: %s", (value) => {
    expect(validateEmail(value)).toBe(true);
  });

  it.each([
    "not-an-email",
    "a @b.co",
    "@example.com",
    "you@",
    "you@@example.com",
    "you@example",
    "you@example.",
  ])("returns a ZodError for invalid email: %s", (value) => {
    const result = validateEmail(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });
});
