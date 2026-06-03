import { describe, expect, it } from "vitest";
import {
  AUTH_EMAIL_DEV_RESTRICTION_MESSAGE,
  authEmailError,
} from "./auth-email";

describe("authEmailError", () => {
  it("is silent for empty input", () => {
    expect(authEmailError("")).toBeNull();
    expect(authEmailError("   ")).toBeNull();
  });

  it("accepts valid emails that include +clerk_test", () => {
    expect(authEmailError("cursor+clerk_test@something.other")).toBeNull();
    expect(authEmailError("you+clerk_test@example.com")).toBeNull();
  });

  it("rejects valid emails without +clerk_test", () => {
    expect(authEmailError("you@example.com")).toBe(
      AUTH_EMAIL_DEV_RESTRICTION_MESSAGE,
    );
  });

  it("rejects malformed emails", () => {
    expect(authEmailError("not-an-email")).not.toBeNull();
    expect(authEmailError("not-an-email")).not.toBe(
      AUTH_EMAIL_DEV_RESTRICTION_MESSAGE,
    );
  });
});
