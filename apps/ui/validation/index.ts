/**
 * Validation surface for the kit's text inputs.
 *
 * Every leaf returns `true | ZodError` -- `true` (the literal, not the
 * wider `boolean`) when the value passes the schema, the raw
 * {@link import("zod").ZodError} otherwise. Keeping the failure branch
 * structured lets callers pick their own message-extraction policy
 * (first-issue line, treeified error tree, copy-deck remap, ...) instead
 * of being locked into whatever phrasing the kit ships.
 *
 * Empty input is **not** special-cased -- the schema decides. Most
 * validators (email, handle, phone, URL, IP/CIDR) reject empty on
 * shape grounds, so a blank field surfaces as a ZodError just like
 * `"not-an-email"` would. `validation.length` is the lone exception:
 * empty passes when `min` is unset (no rule violated) and fails the
 * moment `min` is supplied. If a field's UX wants empty to count as
 * "untyped, no error yet", **the consumer** owns that branch -- swap
 * the call site to a length-gated extraction:
 *
 * ```tsx
 * import { validation } from "../validation";
 *
 * const result = validation.email(email);
 * const error =
 *   email.length === 0
 *     ? undefined                              // consumer-side: empty is silent
 *     : result === true
 *       ? undefined
 *       : result.issues[0]?.message;
 *
 * <TextInput
 *   type="email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={error}
 * />
 * ```
 *
 * The `true` literal narrows cleanly with `result === true`, so no
 * `instanceof ZodError` import is needed at the call site.
 *
 * Surface map:
 *
 * | Call                          | Validates                       |
 * | ----------------------------- | ------------------------------- |
 * | `validation.email(v)`         | email address                   |
 * | `validation.handle(v)`        | `@handle`                       |
 * | `validation.phone(v)`         | phone number (format-lenient)   |
 * | `validation.url(v)`           | URL (https + local http)        |
 * | `validation.length(v, b)`     | string length (caller's bounds) |
 * | `validation.ip.any(v)`        | IPv4 or IPv6                    |
 * | `validation.ip.v4(v)`         | IPv4 only                       |
 * | `validation.ip.v6(v)`         | IPv6 only                       |
 * | `validation.ip.cidr.any(v)`   | CIDR v4 or v6                   |
 * | `validation.ip.cidr.v4(v)`    | CIDR v4 only                    |
 * | `validation.ip.cidr.v6(v)`    | CIDR v6 only                    |
 * | `validation.ip.ipOrCidr(v)`   | any IP or any CIDR              |
 *
 * `validation.length` is the one heterogeneous leaf -- it takes the
 * value *and* a `{ min?, max? }` bounds object because length is
 * caller-policy, not a fixed rule. Every other leaf is the standard
 * `(value: string) => string | undefined` shape that plugs directly
 * into `<TextInput error={...} />`.
 *
 * Per-validator files (`./email`, `./handle`, `./phone`, `./url`,
 * `./ip`, `./length`) still ship their Zod schemas and validate
 * functions as named exports for anyone composing schemas with
 * `z.object`, `safeParse`, etc. -- this barrel just surfaces the
 * call-site-friendly aggregator.
 */
import { validateEmail } from "./email";
import { validateHandle } from "./handle";
import { validateLength } from "./length";
import { validatePhone } from "./phone";
import { validateUrl } from "./url";
import {
  validateCidr,
  validateCidrv4,
  validateCidrv6,
  validateIp,
  validateIpOrCidr,
  validateIpv4,
  validateIpv6,
} from "./ip";

const cidr = {
  any: validateCidr,
  v4: validateCidrv4,
  v6: validateCidrv6,
} as const;

export const validation = {
  email: validateEmail,
  handle: validateHandle,
  phone: validatePhone,
  url: validateUrl,
  length: validateLength,
  ip: {
    any: validateIp,
    v4: validateIpv4,
    v6: validateIpv6,
    cidr,
    ipOrCidr: validateIpOrCidr,
  },
} as const;
