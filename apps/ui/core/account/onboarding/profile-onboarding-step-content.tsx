import type { ReactNode } from "react";
import { ProfileOnboardingAvatarStep } from "./ProfileOnboardingAvatarStep";
import { ProfileOnboardingBioStep } from "./ProfileOnboardingBioStep";
import { ProfileOnboardingFollowsStep } from "./ProfileOnboardingFollowsStep";
import { ProfileOnboardingInterestsStep } from "./ProfileOnboardingInterestsStep";
import { ProfileOnboardingOtherStep } from "./ProfileOnboardingOtherStep";
import { ProfileOnboardingLocationStep } from "./ProfileOnboardingLocationStep";
import { ProfileOnboardingNameStep } from "./ProfileOnboardingNameStep";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";
import type { ProfileOnboardingStepId } from "./profile-onboarding-steps";

export type ProfileOnboardingStepContentProps = {
  stepId: ProfileOnboardingStepId;
  draft: ProfileOnboardingDraft;
  handleSeed: string;
  onChange: (draft: ProfileOnboardingDraft) => void;
  onPickAvatar: () => void;
  onOpenProfileSettings: () => void;
  fieldError?: string | null;
};

export function ProfileOnboardingStepContent({
  stepId,
  draft,
  handleSeed,
  onChange,
  onPickAvatar,
  onOpenProfileSettings,
  fieldError = null,
}: ProfileOnboardingStepContentProps): ReactNode {
  switch (stepId) {
    case "name":
      return (
        <ProfileOnboardingNameStep
          draft={draft}
          onChange={onChange}
          nameError={fieldError}
        />
      );
    case "avatar":
      return (
        <ProfileOnboardingAvatarStep
          draft={draft}
          handleSeed={handleSeed}
          onPickAvatar={onPickAvatar}
        />
      );
    case "location":
      return (
        <ProfileOnboardingLocationStep
          draft={draft}
          onChange={onChange}
          locationError={fieldError}
        />
      );
    case "bio":
      return (
        <ProfileOnboardingBioStep
          draft={draft}
          onChange={onChange}
          bioError={fieldError}
        />
      );
    case "other":
      return (
        <ProfileOnboardingOtherStep onOpenProfileSettings={onOpenProfileSettings} />
      );
    case "interests":
      return <ProfileOnboardingInterestsStep draft={draft} onChange={onChange} />;
    case "follows":
      return <ProfileOnboardingFollowsStep draft={draft} onChange={onChange} />;
    default: {
      const _exhaustive: never = stepId;
      return _exhaustive;
    }
  }
}
