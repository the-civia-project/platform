/**
 * Reads the configured EUDI verifier `client_id` (`x509_hash:…`) from Expo extra.
 */
import Constants from "expo-constants";
import { normalizeEudiX509HashClientId, type EudiX509HashClientId } from "./build-eudi-authorization-request-uri";

/**
 * Returns the app-wide EUDI verifier client id from
 * `EXPO_PUBLIC_EUDI_X509_HASH_CLIENT_ID` (bare hash or full `x509_hash:` value).
 */
export function getEudiX509HashClientId(): EudiX509HashClientId {
  const fromExtra = Constants.expoConfig?.extra?.eudiX509HashClientId;
  const raw =
    typeof fromExtra === "string" && fromExtra.trim().length > 0
      ? fromExtra
      : process.env.EXPO_PUBLIC_EUDI_X509_HASH_CLIENT_ID;

  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      "Set EXPO_PUBLIC_EUDI_X509_HASH_CLIENT_ID in the root .env",
    );
  }

  return normalizeEudiX509HashClientId(raw);
}
