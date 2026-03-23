/**
 * Thin hook that resolves a URL into the kit's
 * {@link "../../components/Media".LinkPreviewData} shape so the
 * composer's `onAddLink` intent can stage an OG preview without the
 * caller writing the resolution logic themselves.
 *
 * The first-pass implementation is deliberately lo-fi: we attempt a
 * client-side `fetch(url)`, parse a handful of OG meta tags out of the
 * returned HTML, and fall back to a {@link stubPreviewFromUrl} when
 * either step fails (CORS, network error, malformed HTML, ...). A
 * proper server-side resolver is a follow-up; this file is the
 * placeholder that keeps the composer usable end-to-end in the
 * meantime.
 */
import { useCallback } from "react";
import type { LinkPreviewData } from "../../components/Media";

/**
 * Public API returned by {@link useLinkResolver}.
 */
export type LinkResolverApi = {
  /**
   * Resolves `url` into a {@link LinkPreviewData}. Returns `null` when
   * the URL is unparseable; otherwise returns a populated payload
   * (often partially synthesised when the OG fetch failed).
   */
  resolve: (url: string) => Promise<LinkPreviewData | null>;
};

/**
 * Returns the resolver API. Stateless under the hood -- the hook is
 * just here to match the other `core/composer/*` ergonomics so consumers
 * follow the same `const { resolve } = useLinkResolver();` pattern.
 */
export function useLinkResolver(): LinkResolverApi {
  const resolve = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const normalised = ensureScheme(trimmed);
    const parsed = safeParseUrl(normalised);
    if (!parsed) return null;

    try {
      const response = await fetch(normalised, { method: "GET" });
      if (!response.ok) return stubPreviewFromUrl(parsed);
      const html = await response.text();
      const og = extractOgTags(html);
      return {
        url: normalised,
        title: og.title ?? prettyTitleFromUrl(parsed),
        description: og.description,
        domain: canonicalDomain(parsed),
        image: og.image,
      };
    } catch {
      return stubPreviewFromUrl(parsed);
    }
  }, []);

  return { resolve };
}

/**
 * Prepends `https://` if the caller didn't include a scheme. Most
 * users type `example.com/path` rather than the full URL, and the
 * picker should still produce a usable preview.
 */
function ensureScheme(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/**
 * Parses a URL string into a `URL` instance, returning `null` when the
 * string isn't a valid URL. We do this in a `try/catch` because
 * `new URL("...")` throws on invalid input -- and the composer's call
 * site wants a graceful `null` rather than an unhandled rejection.
 */
function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Drops a leading `www.` so the visible domain badge reads as
 * `nytimes.com` rather than `www.nytimes.com`. Different products
 * canonicalise differently (some strip every subdomain, some keep
 * them) -- this is the kit-screen default; production code can swap
 * in its own policy.
 */
function canonicalDomain(parsed: URL): string {
  return parsed.hostname.replace(/^www\./, "");
}

/**
 * Synthesises a {@link LinkPreviewData} from just the URL, used when
 * the OG fetch fails. Visible domain plus a humanised path-derived
 * title is enough to keep the staged attachment useful while the user
 * decides whether to keep or drop it.
 */
function stubPreviewFromUrl(parsed: URL): LinkPreviewData {
  return {
    url: parsed.toString(),
    title: prettyTitleFromUrl(parsed),
    domain: canonicalDomain(parsed),
  };
}

/**
 * Turns the URL's last path segment into a humanised title (`-` / `_`
 * → spaces, leading-cap each word). Used as the fallback when the
 * fetched HTML has no `og:title`. For the bare root path we just
 * surface the domain so the title slot stays useful instead of empty.
 */
function prettyTitleFromUrl(parsed: URL): string {
  const segments = parsed.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return canonicalDomain(parsed);
  return last
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Minimal OG-tag extractor. We don't reach for `cheerio` / `parse5` /
 * anything heavier because the composer just needs three fields and
 * shipping an HTML parser to a React Native client is overkill.
 * Regex matches OG `property` / `name` meta tags in either attribute
 * order; missing tags return `undefined` so the caller can substitute
 * URL-derived fallbacks.
 */
function extractOgTags(html: string): {
  title?: string;
  description?: string;
  image?: string;
} {
  return {
    title: matchMeta(html, ["og:title", "twitter:title"]),
    description: matchMeta(html, ["og:description", "twitter:description", "description"]),
    image: matchMeta(html, ["og:image", "twitter:image"]),
  };
}

/**
 * Finds the first `<meta>` tag whose `property` / `name` matches one
 * of `keys`, and returns its `content`. Returns `undefined` when no
 * match exists; matches are case-insensitive and ignore attribute
 * order (`property="og:title"` and `name="og:title"` both count).
 */
function matchMeta(html: string, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const escaped = key.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*['"]${escaped}['"][^>]*content\\s*=\\s*['"]([^'"]+)['"]`,
      "i",
    );
    const alt = new RegExp(
      `<meta[^>]+content\\s*=\\s*['"]([^'"]+)['"][^>]+(?:property|name)\\s*=\\s*['"]${escaped}['"]`,
      "i",
    );
    const match = html.match(pattern) ?? html.match(alt);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return undefined;
}

/**
 * Decodes the small set of HTML entities OG strings commonly carry
 * (`&amp;`, `&quot;`, ...) so the staged preview reads cleanly. Doesn't
 * attempt full entity decoding -- callers can swap in a more thorough
 * implementation once we have a real link resolver.
 */
function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
