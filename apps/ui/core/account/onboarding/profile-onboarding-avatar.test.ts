import { describe, expect, it } from "vitest";
import { avatarFromHandle } from "../avatar-from-handle";
import { createDefaultProfileOnboardingDraft } from "./profile-onboarding-draft";
import { resolveProfileOnboardingAvatar } from "./profile-onboarding-avatar";

describe("resolveProfileOnboardingAvatar", () => {
  it("uses handle seed when no local pick", () => {
    const draft = createDefaultProfileOnboardingDraft();
    expect(resolveProfileOnboardingAvatar(draft, "@aria.popescu")).toBe(
      avatarFromHandle("@aria.popescu"),
    );
  });

  it("prefers a local preview URI", () => {
    const draft = {
      ...createDefaultProfileOnboardingDraft(),
      localAvatarUri: "file:///picked.jpg",
    };
    expect(resolveProfileOnboardingAvatar(draft, "@aria.popescu")).toBe(
      "file:///picked.jpg",
    );
  });
});
