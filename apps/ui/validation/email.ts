/**
 * Email validation.
 *
 * Backed by zod's built-in {@link z.email} validator, which uses a
 * comparatively strict regex roughly equivalent to Gmail's rules -- strict
 * enough to reject the obvious typos people make in real forms (no @,
 * trailing dot, missing TLD, embedded whitespace) without being so strict
 * that legitimate addresses bounce.
 */
import { z, type ZodError } from "zod";
import { validate } from "./helpers";

/**
 * Zod schema for email values. Composes with `z.object`, `safeParse`, and
 * every other zod primitive -- reach for this when you want strict
 * validation inside a larger form schema; reach for {@link validateEmail}
 * when you just need the error-message string for the kit's
 * `<TextInput error={...} />` slot.
 */
export const emailSchema = z.email({
  error: "Enter a valid email address -- e.g. you@example.com.",
});

/**
 * Validate an email string against {@link emailSchema}.
 *
 * Empty input is **not** special-cased -- `z.email` rejects empty
 * strings on shape grounds, so a blank field will surface as a
 * ZodError. If you want empty to count as "untyped, no error yet",
 * suppress the result consumer-side. See {@link validate} for the
 * kit-wide policy.
 *
 * @returns `true` when the value is a valid email, otherwise the raw
 *   {@link ZodError} for the caller to format (`.issues[0]?.message`,
 *   `z.treeifyError(...)`, or any custom mapping).
 */
export function validateEmail(value: string): true | ZodError {
  return validate(emailSchema, value);
}
