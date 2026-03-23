import { describe, expect, it } from "vitest";
import {
  profileOnboardingStepIsOptional,
  profileOnboardingStepShowsSkip,
} from "./profile-onboarding-steps";

describe("profile onboarding steps", () => {
  it("marks profile fields and discovery steps as optional", () => {
    expect(profileOnboardingStepIsOptional("name")).toBe(true);
    expect(profileOnboardingStepIsOptional("other")).toBe(false);
  });

  it("hides skip on other and on terminal follows", () => {
    expect(profileOnboardingStepShowsSkip("other")).toBe(false);
    expect(profileOnboardingStepShowsSkip("follows")).toBe(false);
    expect(profileOnboardingStepShowsSkip("name")).toBe(true);
  });
});
