import type { ZodError } from "zod";
import { validateHandle } from "../../validation/handle";
import type { CitizenshipNumericCode } from "./countries";
import type { RegisterPlatformUserInput } from "./platform-api";
import { generateSuggestedHandle } from "./suggested-handle";

export type RegistrationProfile = {
  citizenOf: CitizenshipNumericCode | null;
  handle: string;
};

export function createDefaultRegistrationProfile(): RegistrationProfile {
  return {
    citizenOf: null,
    handle: generateSuggestedHandle(),
  };
}

/** EU country and a non-empty username are required. */
export function isRegistrationProfileReady(
  profile: RegistrationProfile,
): boolean {
  return profile.citizenOf !== null && profile.handle.trim().length > 0;
}

function validationMessage(result: true | ZodError): string | null {
  return result === true ? null : (result.issues[0]?.message ?? "Invalid value");
}

export function validateRegistrationProfileFields(profile: RegistrationProfile): {
  handleError: string | null;
  formError: string | null;
} {
  if (profile.citizenOf === null) {
    return {
      handleError: null,
      formError: "Select your EU country.",
    };
  }

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
    citizen_of: [profile.citizenOf!],
    handle: profile.handle.trim(),
    location: null,
    avatar_key: null,
  };
}
