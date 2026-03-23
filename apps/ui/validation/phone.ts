/**
 * Phone number validation.
 *
 * The schema is **format-lenient**: it strips the common cosmetic
 * formatting characters (spaces, hyphens, parentheses, dots) before
 * checking the digit shape. So `+1 (555) 555-1234`, `+15555551234`, and
 * `555.555.1234` all parse cleanly even though the user typed them
 * differently -- the "clean" comparison is what your backend / E.164
 * formatter will see anyway, and there's no UX win in scolding someone
 * for typing the same digits with friendlier punctuation.
 *
 * The post-strip shape requires 7-15 digits with an optional leading `+`,
 * optionally followed by a `#<digits>` extension suffix (1-10 digits).
 * Seven is the ITU's minimum subscriber-number length; fifteen is the
 * E.164 maximum total length (country code + national number). The `#`
 * extension marker is the long-standing PBX / RFC 3966 convention for
 * "and then dial these additional digits once connected" -- it's
 * preserved through the strip (like `+`) because it carries semantic
 * weight. The kit doesn't ship a country-aware normaliser (no
 * libphonenumber yet) -- pair with one server-side when you need true
 * E.164 canonicalisation.
 *
 * Examples that parse cleanly:
 *
 * - `+1 (555) 555-1234` -- standard E.164-ish national number
 * - `555-555-1234#100` -- with a 3-digit extension
 * - `+1 555 555 1234 #5678` -- whitespace around `#` stripped, ext kept
 * - `(555) 555.1234#1` -- mixed formatting + 1-digit extension
 */
import { z, type ZodError } from "zod";
import { validate } from "./helpers";

/**
 * Characters considered cosmetic and stripped before validation.
 * Whitespace, hyphens, parentheses, and dots -- the standard set that
 * users type "just to make it readable". `+` and `#` are *preserved*:
 * `+` is the E.164 country-code marker, `#` is the extension delimiter,
 * and the digit regex consumes both at specific positions.
 */
const FORMATTING = /[\s\-().]/g;

/**
 * Post-strip shape: optional leading `+`, then 7-15 digits, then an
 * optional `#` followed by 1-10 extension digits. Capped at 10 because
 * real-world PBX extensions rarely exceed 6-8 digits and 10 leaves a
 * comfortable buffer for outlier setups without letting noise (e.g. a
 * user accidentally pasting two numbers) sneak through.
 * @internal
 */
const PHONE_DIGITS = /^\+?[0-9]{7,15}(?:#[0-9]{1,10})?$/;

/**
 * Zod schema for phone-number values. The lenient strip-then-check
 * approach lives in a `.refine()` because the schema's input is the raw
 * user-typed string -- we don't want zod to *transform* the value (the
 * field stores what the user typed, the validation runs against the
 * normalised form).
 */
export const phoneSchema = z.string().refine(
  (value) => PHONE_DIGITS.test(value.replace(FORMATTING, "")),
  {
    error:
      "Enter a phone number with 7-15 digits, optionally starting with + and optionally ending with a #<extension> of 1-10 digits.",
  },
);

/**
 * Validate a phone-number string against {@link phoneSchema}.
 *
 * Empty input is **not** special-cased -- the digit-shape check fails
 * for a blank string, so an empty field surfaces as a ZodError.
 * Suppress consumer-side if you want a "untyped, no error yet" UX.
 * See {@link validate} for the kit-wide policy.
 *
 * @returns `true` when the value is a valid phone number, otherwise
 *   the raw {@link ZodError} for the caller to format.
 */
export function validatePhone(value: string): true | ZodError {
  return validate(phoneSchema, value);
}
