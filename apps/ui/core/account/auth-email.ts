import { validateEmail } from "../../validation/email";

/** Substring required in auth email addresses during active development. */
export const CLERK_TEST_EMAIL_TAG = "+clerk_test";

export const AUTH_EMAIL_DEV_RESTRICTION_MESSAGE =
  "Only emails containing +clerk_test are accepted due to heavy development — e.g. something+clerk_test@example.com.";

/**
 * Validation for Clerk sign-in and sign-up email fields.
 *
 * Empty input is silent so the field does not error while the user is still
 * typing; once non-empty, the value must pass {@link validateEmail} and include
 * {@link CLERK_TEST_EMAIL_TAG}.
 */
export function authEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const emailResult = validateEmail(trimmed);
  if (emailResult !== true) {
    return emailResult.issues[0]?.message ?? "Enter a valid email address.";
  }

  if (!trimmed.includes(CLERK_TEST_EMAIL_TAG)) {
    return AUTH_EMAIL_DEV_RESTRICTION_MESSAGE;
  }

  return null;
}
