import Constants from "expo-constants";

const DEFAULT_EUDI_VERIFIER_PUBLIC_URL = "https://civia-platform-api.fly.dev";

export function getEudiVerifierPublicUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.eudiVerifierPublicUrl;
  if (typeof fromExtra === "string" && fromExtra.length > 0) {
    return fromExtra.replace(/\/$/, "");
  }
  return DEFAULT_EUDI_VERIFIER_PUBLIC_URL;
}

/**
 * HTTPS `request_uri` for {@link EUDIQRCode} — wallet GETs the signed JAR at
 * `{verifier}/wallet/presentation/start/{sessionId}` (German PID guide §3.1).
 */
export function buildEudiPresentationRequestUri(sessionId: string): string {
  const trimmed = sessionId.trim();
  if (!trimmed) {
    throw new Error("Session id is required to build the EUDI request URI.");
  }

  const encoded = encodeURIComponent(trimmed);
  return `${getEudiVerifierPublicUrl()}/wallet/presentation/start/${encoded}`;
}
