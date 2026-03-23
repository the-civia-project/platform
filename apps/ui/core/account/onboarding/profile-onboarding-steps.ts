/**
 * Post-registration onboarding step metadata (hero copy per step).
 */

export type ProfileOnboardingStepId =
  | "name"
  | "avatar"
  | "location"
  | "bio"
  | "other"
  | "interests"
  | "follows";

export type ProfileOnboardingStepMeta = {
  id: ProfileOnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export const PROFILE_ONBOARDING_SKIP_LABEL = "Skip this step";

export const PROFILE_ONBOARDING_STEPS: readonly ProfileOnboardingStepMeta[] = [
  {
    id: "name",
    eyebrow: "Welcome · 1 of 7",
    title: "What should we call you?",
    subtitle:
      "A display name on your public profile. Leave it blank to keep your @handle only.",
  },
  {
    id: "avatar",
    eyebrow: "Your profile · 2 of 7",
    title: "Profile photo",
    subtitle:
      "We already generated an avatar from your @handle. Upload a photo only if you want to.",
  },
  {
    id: "location",
    eyebrow: "Your profile · 3 of 7",
    title: "Where are you based?",
    subtitle: "City or region — helps others find local conversation.",
  },
  {
    id: "bio",
    eyebrow: "Your profile · 4 of 7",
    title: "A few words about you",
    subtitle: "A short bio on your public profile. You can write this later.",
  },
  {
    id: "other",
    eyebrow: "Your profile · 5 of 7",
    title: "Everything else",
    subtitle:
      "Other profile details can be added anytime in Settings → Profile.",
  },
  {
    id: "interests",
    eyebrow: "Your feed · 6 of 7",
    title: "What interests you?",
    subtitle: "Pick topics for your feed preview — or skip and choose later.",
  },
  {
    id: "follows",
    eyebrow: "People to follow · 7 of 7",
    title: "Suggested accounts",
    subtitle: "Follow voices for your feed preview — or continue without selecting any.",
  },
] as const;

export function profileOnboardingStepIsOptional(
  stepId: ProfileOnboardingStepId,
): boolean {
  return stepId !== "other";
}

/** Informational or terminal steps — Continue only, no Skip. */
export function profileOnboardingStepShowsSkip(
  stepId: ProfileOnboardingStepId,
): boolean {
  return profileOnboardingStepIsOptional(stepId) && stepId !== "follows";
}
