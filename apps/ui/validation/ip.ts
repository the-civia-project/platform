/**
 * IP-address and CIDR-block validation.
 *
 * Backed entirely by zod v4's built-in {@link z.ipv4}, {@link z.ipv6},
 * {@link z.cidrv4}, and {@link z.cidrv6} validators -- they ship the right
 * regexes for both formats out of the box, including the IPv6 short-form
 * (`::`), zone IDs, and CIDR mask range checks (`/0`-`/32` for IPv4,
 * `/0`-`/128` for IPv6).
 *
 * The kit re-exposes those primitives plus two `union` schemas that
 * accept "either family" -- most product features that take a network
 * input don't care which IP version the user types, and asking the
 * caller to pick between `validateIpv4` / `validateIpv6` upfront just
 * forces them to fan their UI out for no real reason. Reach for the
 * version-specific schemas only when you genuinely need one and not the
 * other (e.g. a v4-only DHCP pool, a v6-only firewall rule).
 */
import { z, type ZodError } from "zod";
import { validate } from "./helpers";

/* ────────────────────────────────────────────────────────────────────── */
/*  Single-version schemas                                                */
/* ────────────────────────────────────────────────────────────────────── */

/**
 * Strict IPv4 address -- four 0-255 octets separated by dots
 * (e.g. `192.168.1.42`).
 */
export const ipv4Schema = z.ipv4({
  error: "Enter a valid IPv4 address -- e.g. 192.168.1.42.",
});

/**
 * Strict IPv6 address -- eight 16-bit groups in hex, with the standard
 * `::` short-form for runs of zero groups (e.g. `2001:db8::1`).
 */
export const ipv6Schema = z.ipv6({
  error: "Enter a valid IPv6 address -- e.g. 2001:db8::1.",
});

/**
 * IPv4 CIDR block -- an IPv4 address followed by `/0`-`/32`
 * (e.g. `192.168.0.0/24`).
 */
export const cidrv4Schema = z.cidrv4({
  error: "Enter a valid IPv4 CIDR block -- e.g. 192.168.0.0/24.",
});

/**
 * IPv6 CIDR block -- an IPv6 address followed by `/0`-`/128`
 * (e.g. `2001:db8::/32`).
 */
export const cidrv6Schema = z.cidrv6({
  error: "Enter a valid IPv6 CIDR block -- e.g. 2001:db8::/32.",
});

/* ────────────────────────────────────────────────────────────────────── */
/*  Union schemas -- "any IP" / "any CIDR"                                 */
/*                                                                        */
/*  Implemented with `superRefine` (not `z.union(...)`) so each schema    */
/*  emits a single, friendly error message on failure. A raw `z.union`    */
/*  surfaces one issue per branch -- "didn't match v4" PLUS "didn't       */
/*  match v6" -- which reads as noise to anyone who just typed a typo'd   */
/*  IP and wants one actionable line. The inner version-specific schemas */
/*  keep their detailed messages for callers that target one family.     */
/* ────────────────────────────────────────────────────────────────────── */

/** Either IPv4 or IPv6. */
export const ipSchema = z.string().superRefine((value, ctx) => {
  if (ipv4Schema.safeParse(value).success) return;
  if (ipv6Schema.safeParse(value).success) return;
  ctx.addIssue("Enter a valid IPv4 or IPv6 address.");
});

/** Either IPv4 or IPv6 CIDR notation. */
export const cidrSchema = z.string().superRefine((value, ctx) => {
  if (cidrv4Schema.safeParse(value).success) return;
  if (cidrv6Schema.safeParse(value).success) return;
  ctx.addIssue(
    "Enter a valid CIDR block -- e.g. 192.168.0.0/24 or 2001:db8::/32.",
  );
});

/**
 * Any of the four -- a bare IP **or** a CIDR block, v4 or v6. Use this
 * when the field's downstream consumer doesn't care which: a single
 * address (`10.0.0.5`) and a block (`10.0.0.0/24`) are both meaningful
 * inputs to a firewall rule, a route table, an allow-list, etc.
 */
export const ipOrCidrSchema = z.string().superRefine((value, ctx) => {
  if (ipv4Schema.safeParse(value).success) return;
  if (ipv6Schema.safeParse(value).success) return;
  if (cidrv4Schema.safeParse(value).success) return;
  if (cidrv6Schema.safeParse(value).success) return;
  ctx.addIssue(
    "Enter an IP address or CIDR block -- e.g. 10.0.0.5 or 192.168.0.0/24.",
  );
});

/* ────────────────────────────────────────────────────────────────────── */
/*  Validate-function wrappers                                            */
/*                                                                        */
/*  Empty input is **not** special-cased -- every IP/CIDR regex rejects   */
/*  the empty string on shape grounds, so a blank value surfaces as a     */
/*  ZodError. Suppress consumer-side if you want a "untyped, no error     */
/*  yet" UX. See `validate` for the kit-wide policy. On failure the raw   */
/*  ZodError comes back so the caller picks the message-extraction        */
/*  policy that fits their surface -- `.issues[0]?.message`,              */
/*  `z.treeifyError(...)`, or whatever bespoke mapping their copy deck    */
/*  wants.                                                                */
/* ────────────────────────────────────────────────────────────────────── */

/** Validate as IPv4 only -- see {@link ipv4Schema}. */
export function validateIpv4(value: string): true | ZodError {
  return validate(ipv4Schema, value);
}

/** Validate as IPv6 only -- see {@link ipv6Schema}. */
export function validateIpv6(value: string): true | ZodError {
  return validate(ipv6Schema, value);
}

/** Validate as either IPv4 or IPv6 -- see {@link ipSchema}. */
export function validateIp(value: string): true | ZodError {
  return validate(ipSchema, value);
}

/** Validate as IPv4 CIDR only -- see {@link cidrv4Schema}. */
export function validateCidrv4(value: string): true | ZodError {
  return validate(cidrv4Schema, value);
}

/** Validate as IPv6 CIDR only -- see {@link cidrv6Schema}. */
export function validateCidrv6(value: string): true | ZodError {
  return validate(cidrv6Schema, value);
}

/** Validate as either IPv4 or IPv6 CIDR -- see {@link cidrSchema}. */
export function validateCidr(value: string): true | ZodError {
  return validate(cidrSchema, value);
}

/**
 * Validate as a bare IP **or** a CIDR block, v4 or v6 -- see
 * {@link ipOrCidrSchema}. Use this when the downstream consumer accepts
 * both shapes (firewall rules, route tables, allow-lists).
 */
export function validateIpOrCidr(value: string): true | ZodError {
  return validate(ipOrCidrSchema, value);
}
