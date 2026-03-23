/**
 * Shared helpers used across the validation modules. Internal to the
 * package -- callers consume validators through the `validation`
 * aggregator in {@link "./index"}.
 */
import type { ZodError, ZodType } from "zod";

/**
 * Runs `schema.safeParse(value)` and returns either `true` (the value
 * passes the schema) or the raw {@link ZodError} on failure. The
 * literal `true` (not the wider `boolean`) is intentional -- it lets
 * TypeScript narrow the failure branch to `ZodError` with a plain
 * `result === true` check, no `instanceof` import required at the
 * call site:
 *
 * ```ts
 * const result = validate(emailSchema, value);
 * if (result === true) return;            // valid
 * console.log(result.issues[0]?.message); // ZodError
 * ```
 *
 * Empty strings are passed through to the schema like any other input
 * -- they are **not** short-circuited to `true`. Most kit validators
 * (email, handle, phone, URL, IP/CIDR) reject empty on shape grounds,
 * so an unmodified empty field will surface as a ZodError. Length is
 * the one exception: an empty string passes when no `min` is set
 * (because the rule isn't being violated) and fails as soon as `min`
 * is supplied.
 *
 * If a field's UX wants empty to count as "untyped, no error yet",
 * the **consumer** owns that branch -- the validator's job is "does
 * this string match the schema?", not "should this field be silent
 * right now?". Keeping the two concerns separate means each call site
 * picks its own emptiness policy without forking the rule:
 *
 * ```ts
 * const error = value.length === 0
 *   ? undefined                       // consumer-side: empty is silent
 *   : extractMessage(validation.email(value));
 * ```
 */
export function validate(
  schema: ZodType,
  value: string,
): true | ZodError {
  const result = schema.safeParse(value);
  return result.success ? true : result.error;
}
