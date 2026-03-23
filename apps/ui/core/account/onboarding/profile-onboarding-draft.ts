import type { ZodError } from "zod";
import { validateLength } from "../../../validation/length";

export type ProfileOnboardingDraft = {
  name: string;
  location: string;
  bio: string;
  localAvatarUri: string | null;
  interestIds: readonly string[];
  followedAccountIds: readonly string[];
};

export function createDefaultProfileOnboardingDraft(): ProfileOnboardingDraft {
  return {
    name: "",
    location: "",
    bio: "",
    localAvatarUri: null,
    interestIds: [],
    followedAccountIds: [],
  };
}

function validationMessage(result: true | ZodError): string | null {
  return result === true ? null : (result.issues[0]?.message ?? "Invalid value");
}

export function validateProfileOnboardingName(name: string): string | null {
  if (!name.trim()) {
    return null;
  }
  return validationMessage(validateLength(name.trim(), { min: 1, max: 80 }));
}

export function validateProfileOnboardingLocation(location: string): string | null {
  if (!location.trim()) {
    return null;
  }
  return validationMessage(
    validateLength(location.trim(), { min: 1, max: 120 }),
  );
}

export function validateProfileOnboardingBio(bio: string): string | null {
  if (!bio.trim()) {
    return null;
  }
  return validationMessage(validateLength(bio.trim(), { min: 1, max: 500 }));
}
