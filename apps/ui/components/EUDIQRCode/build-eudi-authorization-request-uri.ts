/**
 * Builds the OpenID4VP authorization-request URI encoded into EUDI cross-device
 * QR codes. Aligns with {@link EUDIQRCode} and HAIP / EUDI Verifier Endpoint
 * session responses (`client_id`, `request_uri`, `request_uri_method`).
 */

/** Prefix for every Civia EUDI verifier {@link EudiAuthorizationRequestInput.clientId}. */
export const EUDI_X509_HASH_CLIENT_ID_PREFIX = "x509_hash:" as const;

/**
 * Verifier client identifier — always `x509_hash:` plus the access-certificate hash.
 */
export type EudiX509HashClientId = `${typeof EUDI_X509_HASH_CLIENT_ID_PREFIX}${string}`;

/** How the wallet fetches the signed request object at {@link EudiAuthorizationRequestInput.requestUri}. */
export type EudiRequestUriMethod = "get" | "post";

/**
 * Custom URL scheme prefix for the authorization request URI inside the QR code.
 * German HAIP deployments use `haip-vp`; generic OpenID4VP uses `openid4vp`.
 */
export type EudiAuthorizationRequestScheme = "haip-vp" | "openid4vp";

/**
 * Inputs required to form a wallet-scannable EUDI presentation request URI.
 */
export type EudiAuthorizationRequestInput = {
  /**
   * Verifier client identifier — always `x509_hash:` followed by the access
   * certificate hash (as returned by the EUDI verifier session API).
   */
  clientId: EudiX509HashClientId;
  /**
   * HTTPS URL where the wallet retrieves the signed authorization request
   * (JAR by reference).
   */
  requestUri: string;
  /**
   * HTTP method the wallet uses at `request_uri`.
   * @defaultValue "post"
   */
  requestUriMethod?: EudiRequestUriMethod;
  /**
   * Scheme for the QR payload.
   * @defaultValue "haip-vp"
   */
  scheme?: EudiAuthorizationRequestScheme;
};

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return trimmed;
}

function assertHttpsRequestUri(requestUri: string): string {
  let parsed: URL;
  try {
    parsed = new URL(requestUri);
  } catch {
    throw new Error("requestUri must be an absolute HTTPS URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("requestUri must use the https: scheme.");
  }

  return parsed.toString();
}

/**
 * Validates and normalizes a verifier `client_id` to `x509_hash:…`.
 *
 * @param clientId - Full client id or bare certificate hash.
 */
export function assertEudiX509HashClientId(clientId: string): EudiX509HashClientId {
  const trimmed = assertNonEmpty(clientId, "clientId");

  if (!trimmed.startsWith(EUDI_X509_HASH_CLIENT_ID_PREFIX)) {
    throw new Error(
      `clientId must start with "${EUDI_X509_HASH_CLIENT_ID_PREFIX}".`,
    );
  }

  const hash = trimmed.slice(EUDI_X509_HASH_CLIENT_ID_PREFIX.length);
  if (!hash) {
    throw new Error(
      `clientId must include a certificate hash after ${EUDI_X509_HASH_CLIENT_ID_PREFIX}`,
    );
  }

  return trimmed as EudiX509HashClientId;
}

/**
 * Normalizes a bare certificate hash or full `x509_hash:` value from config/env.
 *
 * @param raw - Bare hash or full client id.
 */
export function normalizeEudiX509HashClientId(raw: string): EudiX509HashClientId {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("EUDI x509 hash client id must be a non-empty string.");
  }

  if (trimmed.startsWith(EUDI_X509_HASH_CLIENT_ID_PREFIX)) {
    return assertEudiX509HashClientId(trimmed);
  }

  if (trimmed.includes(":")) {
    throw new Error(
      `clientId must start with "${EUDI_X509_HASH_CLIENT_ID_PREFIX}".`,
    );
  }

  return assertEudiX509HashClientId(
    `${EUDI_X509_HASH_CLIENT_ID_PREFIX}${trimmed}`,
  );
}

/**
 * Serializes a cross-device OpenID4VP authorization request URI for QR encoding.
 *
 * @param input - {@link EudiAuthorizationRequestInput}
 */
export function buildEudiAuthorizationRequestUri(
  input: EudiAuthorizationRequestInput,
): string {
  const clientId = assertEudiX509HashClientId(input.clientId);
  const requestUri = encodeURIComponent(assertHttpsRequestUri(input.requestUri))
  const requestUriMethod = input.requestUriMethod ?? "post";
  const scheme = input.scheme ?? "haip-vp";

  if (requestUriMethod !== "get" && requestUriMethod !== "post") {
    throw new Error('requestUriMethod must be "get" or "post".');
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("request_uri", requestUri);
  params.set("request_uri_method", requestUriMethod);

  return `${scheme}://?${params.toString()}`;
}
