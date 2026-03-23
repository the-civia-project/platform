/**
 * Handle validation -- the kit's username-style identifier.
 *
 * Format: a literal `@` prefix, followed by a single ASCII letter, optionally
 * followed by up to 62 more letters, digits, underscores, dots, or dashes.
 * Total length 2-64 chars (`@` + 1 + 0..62) -- a bare `@A` is the smallest
 * valid handle, useful for placeholder accounts, single-letter usernames,
 * and test fixtures. Both **dots** and **dashes** are allowed *inside* the
 * handle so users can mirror domain-style or kebab-style identities
 * (`@aria.popescu`, `@aria-popescu`, `@bsky.app-handle`), with two shared
 * guardrails:
 *
 * - The **last character can't be a separator** (dot or dash) -- avoids
 *   confusing parsing in sentences ("ping @aria." reads as a typo, not
 *   a punctuation choice).
 * - **Two separators can't sit next to each other**, in any combination
 *   (`..`, `--`, `.-`, `-.`) -- `@aria..popescu` and `@aria-.popescu`
 *   have no real-world precedent and are almost always typos.
 *
 * Underscores aren't subject to either guardrail -- `@aria__popescu` is
 * fine, and dots/dashes can sit immediately after an underscore.
 *
 * The "leading letter" rule (the first post-`@` character must be ASCII
 * a-z/A-Z) mirrors most social platforms (Twitter/X, Bluesky, GitHub,
 * Mastodon) and keeps handles searchable -- digit-leading handles tend
 * to collide with raw IDs in routing and URLs.
 *
 * Examples:
 * - `@A` -- valid (minimum length: `@` + 1 letter)
 * - `@aria_popescu` -- valid
 * - `@aria.popescu` -- valid (dots are allowed inside)
 * - `@aria-popescu` -- valid (dashes are allowed inside)
 * - `@aria.popescu.dev` -- valid (multiple non-consecutive separators OK)
 * - `@aria..popescu` -- invalid (consecutive dots)
 * - `@aria--popescu` -- invalid (consecutive dashes)
 * - `@aria.-popescu` -- invalid (mixed adjacent separators)
 * - `@aria.` -- invalid (trailing dot)
 * - `@aria-` -- invalid (trailing dash)
 * - `@_bob` -- invalid (must start with a letter, not `_`)
 * - `@9lives` -- invalid (must start with a letter, not a digit)
 */
import { z, type ZodError } from "zod";
import { validate } from "./helpers";

/**
 * The handle regex -- internal to this module. Callers consume handle
 * validation through {@link handleSchema} (for Zod composition) or
 * {@link validateHandle} (for the kit's `<TextInput error={...} />` slot).
 * Treating the regex as private means we can tighten the rule (extra
 * lookaheads, code-point classes, whatever) without breaking downstream
 * code that copy-pasted the pattern verbatim.
 *
 * Anatomy:
 * - `^@[a-zA-Z]` -- leading `@` and a required leading ASCII letter.
 *   On its own (no rest) this matches the 2-char minimum `@A` form.
 * - `(?: ... )?` -- the rest is **optional**; everything beyond the
 *   leading letter is allowed but not required.
 * - `(?!.*[.-]{2})` -- negative lookahead: no two separator chars
 *   (`.` or `-`) sit next to each other anywhere in the rest. One
 *   lookahead covers `..`, `--`, `.-`, and `-.` in a single pass.
 * - `[a-zA-Z0-9_.\-]{0,61}` -- 0-61 middle chars from the allowed set
 *   (letters, digits, underscores, dots, dashes).
 * - `[a-zA-Z0-9_]` -- when the rest *is* present, the last char must
 *   come from the non-separator subset, which bans trailing dots
 *   *and* trailing dashes without needing a second pass.
 *
 * Total length stays inside 2-64 chars (1 `@` + 1 leading letter, with
 * an optional 1..62-char rest = 2..64). Stored values include the `@`.
 */
const handleRegex =
  /^@[a-zA-Z](?:(?!.*[.-]{2})[a-zA-Z0-9_.\-]{0,61}[a-zA-Z0-9_])?$/;

/**
 * Zod schema for handle values. The error message is intentionally long
 * because handles fail in several specific ways (missing `@`, starts with
 * a digit, contains punctuation, too long, double/trailing separators) --
 * listing all the rules in one breath is friendlier than firing five
 * different messages for a single typo.
 */
export const handleSchema = z.string().regex(handleRegex, {
  error:
    "Start with @ and a letter, then up to 62 more letters, numbers, dots, dashes, or underscores (no double or trailing separators, 64 characters max).",
});

/**
 * Validate a handle string against {@link handleSchema}.
 *
 * Empty input is **not** special-cased -- the regex doesn't match a
 * blank string, so an empty field surfaces as a ZodError. Suppress
 * consumer-side if you want a "untyped, no error yet" UX. See
 * {@link validate} for the kit-wide policy.
 *
 * @returns `true` when the value is a valid handle, otherwise the raw
 *   {@link ZodError} for the caller to format.
 */
export function validateHandle(value: string): true | ZodError {
  return validate(handleSchema, value);
}
