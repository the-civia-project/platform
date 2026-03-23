/**
 * UI-only post-registration onboarding — one step per profile field, then
 * other profile details hint, interests, and suggested follows. No platform API writes.
 */
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View } from "react-native";
import Button from "../../../components/Button";
import { useImagePicker } from "../../composer/use-image-picker";
import { AuthScreen } from "../AuthScreen";
import {
  useAccountActions,
  useNeedsProfileOnboarding,
  usePlatformUser,
} from "../hooks";
import {
  createDefaultProfileOnboardingDraft,
  validateProfileOnboardingBio,
  validateProfileOnboardingLocation,
  validateProfileOnboardingName,
} from "./profile-onboarding-draft";
import { ProfileOnboardingStepContent } from "./profile-onboarding-step-content";
import { ProfileOnboardingOptionalPill } from "./ProfileOnboardingOptionalPill";
import {
  PROFILE_ONBOARDING_SKIP_LABEL,
  PROFILE_ONBOARDING_STEPS,
  profileOnboardingStepIsOptional,
  profileOnboardingStepShowsSkip,
  type ProfileOnboardingStepId,
} from "./profile-onboarding-steps";

export default function ProfileOnboardingScreen() {
  const navigation = useNavigation();
  const { completeProfileOnboarding } = useAccountActions();
  const platformUser = usePlatformUser();
  const needsOnboarding = useNeedsProfileOnboarding();
  const { pickPictures } = useImagePicker();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(createDefaultProfileOnboardingDraft);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const steps = PROFILE_ONBOARDING_STEPS;
  const step = steps[stepIndex] ?? steps[0];
  const handleSeed = platformUser?.handle ?? "@guest";
  const isLastStep = stepIndex >= steps.length - 1;

  if (!needsOnboarding || !step) {
    return null;
  }

  const advance = () => {
    setFieldError(null);
    if (isLastStep) {
      completeProfileOnboarding();
      return;
    }
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
  };

  const validateCurrentStep = (stepId: ProfileOnboardingStepId): boolean => {
    switch (stepId) {
      case "name": {
        const error = validateProfileOnboardingName(draft.name);
        setFieldError(error);
        return !error;
      }
      case "location": {
        const error = validateProfileOnboardingLocation(draft.location);
        setFieldError(error);
        return !error;
      }
      case "bio": {
        const error = validateProfileOnboardingBio(draft.bio);
        setFieldError(error);
        return !error;
      }
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (!validateCurrentStep(step.id)) {
      return;
    }
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  const handlePickAvatar = async () => {
    const picked = await pickPictures(1);
    if (picked.length === 0) {
      return;
    }
    const image = picked[0]!;
    setDraft((current) => ({
      ...current,
      localAvatarUri: image.source,
    }));
  };

  const openProfileSettings = () => {
    navigation.navigate("settings/profile" as never);
  };

  const showSkip = profileOnboardingStepShowsSkip(step.id);

  return (
    <AuthScreen
      eyebrow={step.eyebrow}
      title={step.title}
      subtitle={step.subtitle}
      titleLeading={
        profileOnboardingStepIsOptional(step.id) ? (
          <ProfileOnboardingOptionalPill />
        ) : undefined
      }
    >
      <ProfileOnboardingStepContent
        stepId={step.id}
        draft={draft}
        handleSeed={handleSeed}
        onChange={setDraft}
        onPickAvatar={handlePickAvatar}
        onOpenProfileSettings={openProfileSettings}
        fieldError={fieldError}
      />
      <View style={{ gap: 8 }}>
        <Button variant="primary" onPress={handleContinue}>
          {isLastStep ? "Enter The Civia Platform" : "Continue"}
        </Button>
        {showSkip ? (
          <Button variant="ghost" onPress={handleSkip}>
            {PROFILE_ONBOARDING_SKIP_LABEL}
          </Button>
        ) : null}
      </View>
    </AuthScreen>
  );
}
