/**
 * Pretty-printer for URLs rendered inside post body copy. Given an
 * `href` (typically the {@link PostUrlSegment.href} a {@link Post}
 * receives), produces a short, Twitter / Mastodon-style display
 * string suitable for inline use -- scheme stripped, leading
 * `www.` stripped, trailing `/` trimmed, and the remainder truncated
 * with an ellipsis past {@link DEFAULT_PRETTY_URL_LENGTH} characters.
 *
 * Inline post URLs always run through this formatter: the kit
 * deliberately doesn't accept a caller-supplied anchor-text override
 * for URL segments, so the prettified `href` is the only thing the
 * reader ever sees on a URL run.
 *
 * The function is intentionally a thin formatter:
 *
 * - It does **not** validate that `href` is a well-formed URL. The kit's
 *   {@link "./validation/url".validateUrl} owns input validation; the
 *   prettifier accepts whatever string the caller hands over and just
 *   makes it shorter and friendlier. Garbage in -> shortened garbage
 *   out (which is what a strict caller will already have filtered).
 * - It does **not** decode percent-encoded segments. Decoding would
 *   change byte-length math in unhelpful ways and risks rendering
 *   non-ASCII characters that the consumer might not be ready for.
 * - It does **not** strip query strings or hashes. Truncation handles
 *   length; preserving query/hash means the displayed text still
 *   *suggests* the destination's specificity (`example.com/path?...`)
 *   even when the tail is elided.
 *
 * Kept framework-free (no React, no React Native) so it can be unit-
 * tested in Node and reused for analytics / share-card labelling
 * outside a render tree.
 *
 * @example
 * ```ts
 * prettifyUrl("https://www.example.com/");
 * // => "example.com"
 *
 * prettifyUrl("https://docs.example.com/very/long/path/to/resource?id=42");
 * // => "docs.example.com/very/long/pat\u2026"
 *
 * prettifyUrl("https://example.com/path", 50);
 * // => "example.com/path"
 *
 * prettifyUrl("mailto:foo@bar.com");
 * // => "mailto:foo@bar.com"   // non-http(s) schemes pass through
 * ```
 */

/**
 * Default character budget for the prettified URL. Sized to fit
 * comfortably inline with body copy at the kit's default text size
 * (16/24) -- short enough that one URL doesn't dominate a line, long
 * enough to keep the hostname plus a path hint visible. Tuned by eye
 * against the {@link PostScreen} "Inline URLs" demo; bump locally via
 * the second argument to {@link prettifyUrl} if a specific surface
 * has more room.
 */
export const DEFAULT_PRETTY_URL_LENGTH = 30;

/**
 * Strip cosmetics off an `href` and clamp it to `maxLength` characters
 * for inline display. See the module header for the full contract.
 *
 * The stripping is order-sensitive: scheme first, then `www.`, then a
 * trailing `/`. Scheme regex matches `http://` and `https://` only --
 * `mailto:`, `tel:`, custom-scheme URIs (`app://`, `civia://`) pass
 * through unchanged so the prettifier never lies about the protocol.
 * Truncation reserves one character for the ellipsis, so
 * `prettifyUrl(x, 30)` always returns at most 30 characters whether or
 * not it had to elide.
 *
 * @param href - The raw URL to prettify. Accepts any string; non-URL
 *   inputs are returned with the same scheme-strip-and-truncate
 *   treatment, which is harmless for short strings and is acceptable
 *   even for garbage (the caller has already opted into surfacing the
 *   value verbatim, so prettifying it is no worse than rendering it
 *   raw).
 * @param maxLength - Upper bound on the returned string's length.
 *   Defaults to {@link DEFAULT_PRETTY_URL_LENGTH}. Values <= 1 produce
 *   just the ellipsis (`"\u2026"`) when truncation would otherwise
 *   leave no characters before it -- defensive belt-and-braces for
 *   callers that pass through a config slider without floor-checking.
 * @returns The prettified display string, never longer than
 *   `maxLength` characters.
 */
export function prettifyUrl(
  href: string,
  maxLength: number = DEFAULT_PRETTY_URL_LENGTH,
): string {
  let display = href;
  display = display.replace(/^https?:\/\//i, "");
  display = display.replace(/^www\./i, "");
  if (display.length > 1) {
    display = display.replace(/\/$/, "");
  }
  if (display.length <= maxLength) return display;
  if (maxLength <= 1) return "\u2026";
  return `${display.slice(0, maxLength - 1)}\u2026`;
}
