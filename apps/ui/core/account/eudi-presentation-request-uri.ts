import Constants from "expo-constants";

const DEFAULT_EUDI_VERIFIER_PUBLIC_URL = "https://civia-platform-api.fly.dev";

export function getEudiVerifierPublicUrl(): string {
  const fromExtra = process.env.PLATFORM_API_URL;
  if (typeof fromExtra === "string" && fromExtra.length > 0) {
    return fromExtra.replace(/\/$/, "");
  }
  return DEFAULT_EUDI_VERIFIER_PUBLIC_URL;
}

/**
 * HTTPS `request_uri` for {@link EUDIQRCode} — wallet fetches the signed JAR at
 * `{verifier}/wallet/request.jwt/{userId}`.
 */
export function buildEudiPresentationRequestUri(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new Error("Platform user id is required to build the EUDI request URI.");
  }

  const encodedUserId = encodeURIComponent(trimmed);
  return `${getEudiVerifierPublicUrl()}/wallet/request.jwt/${encodedUserId}`;
}
