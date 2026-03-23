/**
 * URL validation with a kit-specific protocol policy.
 *
 * Rules in plain English:
 * - `https://` is allowed for any host. This is the default web protocol
 *   you want consumers reaching for.
 * - `http://` is allowed only for hostnames that are unambiguously local
 *   to the user's machine or LAN:
 *     * `localhost` and `*.localhost` -- RFC 6761 section 6.3 special-use
 *       names reserved for loopback.
 *     * `*.local` -- RFC 6762 multicast-DNS / Bonjour names (e.g.
 *       `my-mac.local`).
 *     * `127.0.0.0/8`, `0.0.0.0`, `::`, `::1` -- IPv4/IPv6 loopback
 *       literals.
 *     * The three RFC 1918 private IPv4 ranges
 *       (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), plus the IPv6
 *       link-local (`fe80::/10`) and RFC 4193 unique-local (`fc00::/7`)
 *       ranges.
 *   These addresses can never reach the public internet, so the kit
 *   relaxes the "TLS only" rule for them: dev servers, on-prem services,
 *   and local IoT gear all need cleartext HTTP and there's no realistic
 *   eavesdropping risk on a loopback or LAN-local address.
 * - Anything else -- `ftp://`, `file://`, malformed strings, `https://`
 *   with no host -- is rejected.
 *
 * The schema is implemented with `.superRefine()` (rather than chained
 * `.refine()` calls) so it can emit a *specific* message for each failure
 * mode instead of one generic "URL is wrong" line. Users learn faster
 * when the message names the exact problem.
 */
import { z, type ZodError } from "zod";
import { validate } from "./helpers";

/**
 * Literal hostnames that always count as local. Stored as a `Set` so the
 * lookup is O(1) and the list reads as data, not control flow.
 *
 * Membership rationale:
 * - `localhost` -- RFC 6761 section 6.3 reserves the bare name as a
 *   special-use domain that resolves to loopback. The corresponding
 *   wildcard form `*.localhost` lives in {@link LOCAL_SUFFIXES} (same
 *   RFC, suffix-scan path). Splitting bare vs. suffix is purely a
 *   lookup-style choice -- both branches enforce the same RFC clause.
 * - `0.0.0.0` -- IPv4 unspecified address; only valid as a bind target,
 *   never as a destination, so treating it as "definitely not public"
 *   is safe.
 * - `::` / `::1` -- IPv6 unspecified and loopback literals, the v6
 *   counterparts of `0.0.0.0` and `127.0.0.1`.
 */
const LITERAL_LOCAL_HOSTNAMES = new Set<string>([
  "localhost",
  "0.0.0.0",
  "::",
  "::1",
]);

/**
 * Domain suffixes that always count as local. `*.localhost` is reserved
 * by RFC 6761 section 6.3 (loopback special-use namespace, the wildcard
 * counterpart to the bare `localhost` literal above); `*.local` is the
 * RFC 6762 multicast-DNS / Bonjour namespace (`my-mac.local`,
 * `printer.local`). Both are unroutable on the public internet by
 * design.
 */
const LOCAL_SUFFIXES = [".local", ".localhost"] as const;

/**
 * IPv4 loopback range: `127.0.0.0/8`. Pre-anchored regex; the host string
 * has already been lower-cased and stripped of any port by the time we
 * test it.
 */
const LOOPBACK_V4 = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * RFC 1918 private IPv4 ranges:
 * - `10.0.0.0/8`        -- `10.x.x.x`
 * - `172.16.0.0/12`     -- `172.16.x.x` ... `172.31.x.x`
 * - `192.168.0.0/16`    -- `192.168.x.x`
 */
const PRIVATE_V4 = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
];

/**
 * Private/local IPv6 ranges:
 * - `fe80::/10` -- link-local (`fe80`-`febf`)
 * - `fc00::/7` -- unique local (`fc00`-`fdff`)
 *
 * The regex matches the first 4-character group of the lowercase
 * compressed form, which `new URL(...).hostname` always returns for IPv6
 * literals (e.g. `[fe80::1]` becomes `fe80::1`).
 */
const PRIVATE_V6 = [
  /^fe[89ab][\da-f]?:/, // fe80-febf
  /^f[cd][\da-f]{2}:/, // fc00-fdff
];

/**
 * Returns `true` when `hostname` is on the loopback / LAN / link-local
 * lists above. Hostname is the raw `URL.hostname` value -- lower-cased
 * and stripped of the IPv6 bracket pair (`[...]`) WHATWG URLs preserve in
 * `.hostname`, so callers can pass it through unchanged.
 *
 * Exported for the rare caller that wants to apply the same policy
 * outside the schema (e.g. server-side allowlists, redirect filters).
 */
export function isLocalHostname(hostname: string): boolean {
  // WHATWG URL keeps the `[...]` around IPv6 literals in `.hostname` --
  // peel them off so the IPv6 regexes and the literal-loopback Set can
  // see the bare address (`[::1]` → `::1`, `[fe80::1]` → `fe80::1`).
  const stripped = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
  const lower = stripped.toLowerCase();
  if (LITERAL_LOCAL_HOSTNAMES.has(lower)) return true;
  if (LOCAL_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true;
  if (LOOPBACK_V4.test(lower)) return true;
  if (PRIVATE_V4.some((re) => re.test(lower))) return true;
  if (PRIVATE_V6.some((re) => re.test(lower))) return true;
  return false;
}

/**
 * Zod schema for URL values with the protocol policy described in the
 * module header. Three distinct issue messages so the user learns the
 * specific problem with their input instead of getting one catch-all
 * "invalid URL".
 */
export const urlSchema = z.string().superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.addIssue(
      "Enter a full URL -- include the scheme (e.g. https://example.com).",
    );
    return;
  }

  if (url.protocol === "https:") return;

  if (url.protocol === "http:") {
    if (isLocalHostname(url.hostname)) return;
    ctx.addIssue(
      "http:// is only allowed for localhost, .local, or private networks -- use https:// for public addresses.",
    );
    return;
  }

  ctx.addIssue(
    `Unsupported protocol "${url.protocol.replace(":", "")}://" -- use https:// (or http:// for local addresses).`,
  );
});

/**
 * Validate a URL string against {@link urlSchema}.
 *
 * Empty input is **not** special-cased -- `new URL("")` throws, so an
 * empty field surfaces as a ZodError with the scheme-hint message.
 * Suppress consumer-side if you want a "untyped, no error yet" UX.
 * See {@link validate} for the kit-wide policy.
 *
 * @returns `true` when the value is a valid URL, otherwise the raw
 *   {@link ZodError} for the caller to format.
 */
export function validateUrl(value: string): true | ZodError {
  return validate(urlSchema, value);
}
