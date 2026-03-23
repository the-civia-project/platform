import { describe, expect, it } from "vitest";
import {
  createDefaultProfileOnboardingDraft,
  validateProfileOnboardingBio,
  validateProfileOnboardingLocation,
  validateProfileOnboardingName,
} from "./profile-onboarding-draft";

describe("profile onboarding draft", () => {
  it("allows empty optional fields", () => {
    const draft = createDefaultProfileOnboardingDraft();
    expect(validateProfileOnboardingName(draft.name)).toBeNull();
    expect(validateProfileOnboardingLocation(draft.location)).toBeNull();
    expect(validateProfileOnboardingBio(draft.bio)).toBeNull();
  });

  it("validates bio length when filled", () => {
    expect(validateProfileOnboardingBio("x".repeat(501))).toBeTruthy();
  });

  it("validates name length when filled", () => {
    expect(validateProfileOnboardingName("x".repeat(81))).toBeTruthy();
  });
});
