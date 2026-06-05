import type { ZodError } from "zod";
import { validateHandle } from "../../validation/handle";
import type { RegisterPlatformUserInput } from "./platform-api";
import { generateSuggestedHandle } from "./suggested-handle";

export type RegistrationProfile = {
  handle: string;
};

export function createDefaultRegistrationProfile(): RegistrationProfile {
  return {
    handle: generateSuggestedHandle(),
  };
}

/** A non-empty username is required. Citizenship is set later via eIDAS. */
export function isRegistrationProfileReady(
  profile: RegistrationProfile,
): boolean {
  return profile.handle.trim().length > 0;
}

function validationMessage(result: true | ZodError): string | null {
  return result === true ? null : (result.issues[0]?.message ?? "Invalid value");
}

export function validateRegistrationProfileFields(profile: RegistrationProfile): {
  handleError: string | null;
  formError: string | null;
} {
  const trimmedHandle = profile.handle.trim();
  if (!trimmedHandle) {
    return {
      handleError: "Enter a username.",
      formError: null,
    };
  }

  const handleError = validationMessage(validateHandle(trimmedHandle));

  if (handleError) {
    return { handleError, formError: null };
  }

  return { handleError: null, formError: null };
}

export function prepareRegistrationProfileForApi(
  profile: RegistrationProfile,
): RegisterPlatformUserInput {
  if (!isRegistrationProfileReady(profile)) {
    throw new Error("Registration profile is incomplete");
  }

  return {
    handle: profile.handle.trim(),
    location: null,
    avatar_key: null,
  };
}
