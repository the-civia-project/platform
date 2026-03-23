/**
 * Pure URL-detection helper used by the composer's link auto-extraction
 * flow ({@link "./use-draft-link-extraction"}). The composer doesn't
 * accept a manual "add link" action -- URLs come from the body text
 * the user types -- so a small, reliable detector is the seam between
 * the raw body string and the {@link "../../components/Media".LinkPreviewData}
 * the link-resolver hook eventually returns.
 *
 * Scope is deliberately modest: a single regex that matches the first
 * `http://` / `https://` URL in a piece of plain text, with a tiny
 * post-trim step that drops common trailing punctuation
 * (`.,;:!?)]}>"'`). That's enough for the body shapes the composer
 * actually sees (sentences, paragraphs, the occasional URL in
 * parens). Bare `www.foo.com`-style URLs are intentionally *not*
 * matched -- the rendered post's autolinker doesn't promote them
 * either, so the two behaviours stay aligned.
 *
 * Lives in its own module so the rules can be unit-tested in Node
 * without dragging React into the picture -- mirrors
 * {@link "./image-types"} and the pure helpers under `components/`
 * (`Button/resolve-surface`, `PostComposer/draft`, ...).
 */

/**
 * Matches the first `http`/`https` URL in `text` and returns it with
 * trailing punctuation stripped. Returns `null` when no URL is
 * present.
 *
 * Punctuation handling: characters in the set `.,;:!?)]}>"'` at the
 * very end of the match are removed so a sentence like `"check this
 * https://example.com."` resolves to `https://example.com` instead of
 * `https://example.com.`. The stripping is iterative -- multiple
 * trailing punctuation chars (`https://example.com.)`) collapse all
 * the way down.
 *
 * Resolution is intentionally first-only: the rendered post shows a
 * single link preview card regardless of how many URLs the body
 * contains, so a "first wins" policy here matches what users
 * actually see downstream.
 */
export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(URL_PATTERN);
  if (!match) return null;
  return stripTrailingPunctuation(match[0]);
}

/**
 * Match `http://` or `https://` (case-insensitive) followed by any
 * run of non-whitespace, non-angle-bracket characters. The
 * angle-bracket exclusion is there because Markdown-style URL wraps
 * (`<https://example.com>`) appear in some rendered surfaces and we
 * don't want the brackets folded into the match.
 */
const URL_PATTERN = /\bhttps?:\/\/[^\s<>]+/i;

/**
 * Punctuation characters that commonly trail a URL inside prose
 * ("Check this https://example.com."). Stripped iteratively from the
 * end of the match so multi-character trails (`...).`) collapse
 * fully.
 */
const TRAILING_PUNCT = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  ")",
  "]",
  "}",
  ">",
  '"',
  "'",
]);

function stripTrailingPunctuation(url: string): string {
  let end = url.length;
  while (end > 0 && TRAILING_PUNCT.has(url[end - 1])) {
    end -= 1;
  }
  return url.slice(0, end);
}
