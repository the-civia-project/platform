import { avatarFromHandle } from "../avatar-from-handle";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

/** Local pick wins; otherwise DiceBear from the registered handle seed. */
export function resolveProfileOnboardingAvatar(
  draft: ProfileOnboardingDraft,
  handleSeed: string,
): string {
  if (draft.localAvatarUri) {
    return draft.localAvatarUri;
  }
  return avatarFromHandle(handleSeed);
}
