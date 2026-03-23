import { describe, expect, it } from "vitest";
import { validateHandle } from "../../validation/handle";
import {
  createDefaultRegistrationProfile,
  prepareRegistrationProfileForApi,
  validateRegistrationProfileFields,
} from "./registration-profile";

describe("registration profile", () => {
  it("requires EU country and username", () => {
    const profile = createDefaultRegistrationProfile();
    expect(validateRegistrationProfileFields(profile).formError).toMatch(
      /EU country/i,
    );

    const noHandle = {
      ...profile,
      citizenOf: 276 as const,
      handle: "",
    };
    expect(validateRegistrationProfileFields(noHandle).handleError).toMatch(
      /username/i,
    );
  });

  it("starts with a suggested handle", () => {
    const profile = createDefaultRegistrationProfile();
    expect(validateHandle(profile.handle)).toBe(true);
    expect(profile.handle).toMatch(/^@[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[0-9]+$/);
  });

  it("sends handle and country only to the API", () => {
    const profile = {
      ...createDefaultRegistrationProfile(),
      citizenOf: 276 as const,
      handle: "@whimsical.axolotl.42",
    };
    expect(prepareRegistrationProfileForApi(profile)).toEqual({
      citizen_of: [276],
      handle: "@whimsical.axolotl.42",
      location: null,
      avatar_key: null,
    });
  });

  it("rejects invalid handles", () => {
    const profile = {
      ...createDefaultRegistrationProfile(),
      citizenOf: 276 as const,
      handle: "not-a-handle",
    };
    expect(validateRegistrationProfileFields(profile).handleError).toBeTruthy();
  });
});
