/**
 * String length validation.
 *
 * Unlike the other validators in this module (`email`, `handle`, `phone`,
 * `url`, `ip`/`cidr`), length is **parameterised** -- every caller has
 * their own policy ("bio: 1-280 chars", "OTP: exactly 6", "name: max
 * 60"), so the schema is built per-call from a {@link LengthBounds}
 * object instead of being a frozen module-level constant.
 *
 * Both bounds are optional and can be supplied independently. Missing
 * keys are filled in with the {@link LengthBounds} defaults (`min: 0`,
 * `max: Number.MAX_SAFE_INTEGER`), so the schema always operates on
 * concrete numbers:
 *
 * - `{ min }` -- at least N characters (upper bound effectively unbounded)
 * - `{ max }` -- at most N characters (lower bound `0`, so empty passes)
 * - `{ min, max }` -- within a range
 * - `{ min, max }` where `min === max` -- exactly N characters (the error
 *   message collapses to a single "Use exactly N" line, which reads
 *   better than the separate "at least / at most" pair).
 * - `{}` -- the no-op range `0..MAX_SAFE_INTEGER`, every string passes.
 *
 * Length is counted in JavaScript code units (`value.length`) -- the same
 * count that `RNTextInput`'s `maxLength` enforces, so the visual
 * character-by-character feedback matches what users see while typing.
 * That count over-counts surrogate-pair emoji (one "\u{1F600}" = 2 code units) --
 * if you ever need grapheme-cluster precision, swap in an `Intl.Segmenter`
 * sweep at the call site.
 */
import { z, type ZodError, type ZodString } from "zod";
import { validate } from "./helpers";

/**
 * Inclusive lower/upper length bounds. Both keys are optional from the
 * caller's perspective, but the schema always operates on concrete
 * numbers: missing `min` is treated as `0`, missing `max` is treated as
 * `Number.MAX_SAFE_INTEGER`. That lets callers express "at least 3
 * chars, any upper bound" as a terse `{ min: 3 }` and "at most 5
 * chars, no lower bound" as `{ max: 5 }`, while the internal schema
 * stays a uniform `min..max` range with no `undefined` branches.
 *
 * Practical consequences of the defaults:
 *
 * - `{}` is a permissive no-op range -- every string from `""` upward
 *   satisfies `0 <= length <= MAX_SAFE_INTEGER`.
 * - `{ max: 0 }` collapses to the exact-length branch (min and max both
 *   `0`), which yields the "Use exactly 0 characters." message -- a
 *   succinct way to say "must be empty" if you ever need it.
 * - `{ min: 3 }` is shorthand for "3 chars or more"; the `max` arm of
 *   the schema is satisfied for any realistic input.
 */
export interface LengthBounds {
  /** Inclusive minimum, in JS code units. Defaults to `0` when omitted. */
  min?: number;
  /**
   * Inclusive maximum, in JS code units. Defaults to
   * `Number.MAX_SAFE_INTEGER` when omitted -- effectively unbounded.
   */
  max?: number;
}

/**
 * Pluralises the trailing "character(s)" tail used in error messages,
 * so `Use at least 1 character.` and `Use at least 8 characters.` both
 * read naturally. Counts of 0 take the plural form to match English
 * idiom (`0 characters`).
 */
function chars(n: number): string {
  return `${n} character${n === 1 ? "" : "s"}`;
}

/**
 * Build a Zod schema that enforces the given length bounds. The result
 * is a plain `ZodString` so it composes with `z.object`, `safeParse`,
 * `.pipe`, etc. -- reach for this when length is part of a larger form
 * schema; reach for {@link validateLength} when you just need the
 * error-message string for the kit's `<TextInput error={...} />` slot.
 *
 * Missing `min` / `max` keys are normalised to their {@link LengthBounds}
 * defaults (`0` and `Number.MAX_SAFE_INTEGER`) via destructuring, so the
 * schema is always a uniform `.min(lo).max(hi)` pair -- no
 * `undefined`-branched conditionals downstream.
 *
 * When `min === max`, the lower- and upper-bound checks share a single
 * "Use exactly N" message instead of the asymmetric "at least / at most"
 * pair, which reads better for fixed-length fields like OTP codes.
 */
export function lengthSchema({
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
}: LengthBounds): ZodString {
  if (min === max) {
    return z
      .string()
      .min(min, { error: `Use exactly ${chars(min)}.` })
      .max(max, { error: `Use exactly ${chars(max)}.` });
  }
  return z
    .string()
    .min(min, { error: `Use at least ${chars(min)}.` })
    .max(max, { error: `Use at most ${chars(max)}.` });
}

/**
 * Validate a string against the given length bounds.
 *
 * Empty input is **not** special-cased -- the schema decides:
 *
 * - `validateLength("", {})` -> `true` (no rule violated)
 * - `validateLength("", { max: 5 })` -> `true` (length 0 <= 5)
 * - `validateLength("", { min: 1 })` -> ZodError (length 0 < 1)
 * - `validateLength("", { min: 1, max: 280 })` -> ZodError (under min)
 *
 * If you want empty to count as "untyped, no error yet" regardless of
 * bounds, suppress the result consumer-side. See {@link validate}
 * for the kit-wide policy.
 *
 * @example
 * ```tsx
 * const result = validateLength(bio, { min: 1, max: 280 });
 * const message = result === true ? undefined : result.issues[0]?.message;
 *
 * <TextInput
 *   label="Bio"
 *   value={bio}
 *   onChangeText={setBio}
 *   helper="280 characters max."
 *   error={bio.length === 0 ? undefined : message}
 * />
 * ```
 *
 * @returns `true` when the value passes the bounds, otherwise the raw
 *   {@link ZodError} for the caller to format.
 */
export function validateLength(
  value: string,
  bounds: LengthBounds,
): true | ZodError {
  return validate(lengthSchema(bounds), value);
}
