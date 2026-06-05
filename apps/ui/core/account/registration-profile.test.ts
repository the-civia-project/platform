import { describe, expect, it } from "vitest";
import { validateHandle } from "../../validation/handle";
import {
  createDefaultRegistrationProfile,
  prepareRegistrationProfileForApi,
  validateRegistrationProfileFields,
} from "./registration-profile";

describe("registration profile", () => {
  it("requires a username", () => {
    const profile = createDefaultRegistrationProfile();
    const noHandle = { ...profile, handle: "" };
    expect(validateRegistrationProfileFields(noHandle).handleError).toMatch(
      /username/i,
    );
  });

  it("starts with a suggested handle", () => {
    const profile = createDefaultRegistrationProfile();
    expect(validateHandle(profile.handle)).toBe(true);
    expect(profile.handle).toMatch(/^@[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[0-9]+$/);
  });

  it("sends handle only to the API", () => {
    const profile = {
      ...createDefaultRegistrationProfile(),
      handle: "@whimsical.axolotl.42",
    };
    expect(prepareRegistrationProfileForApi(profile)).toEqual({
      handle: "@whimsical.axolotl.42",
      location: null,
      avatar_key: null,
    });
  });

  it("rejects invalid handles", () => {
    const profile = {
      ...createDefaultRegistrationProfile(),
      handle: "not-a-handle",
    };
    expect(validateRegistrationProfileFields(profile).handleError).toBeTruthy();
  });
});
