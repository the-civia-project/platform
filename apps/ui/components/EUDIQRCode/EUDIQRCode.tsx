/**
 * Cross-device EUDI Wallet QR code for OpenID4VP / HAIP PID presentation.
 * Accepts a verifier `requestUri` (and optional scheme / method), reads
 * `clientId` from {@link getEudiX509HashClientId}, builds the wallet-scannable
 * authorization-request URI, and renders it with {@link QrCode}.
 */
import { useMemo } from "react";
import { QrCode, type QrCodeProps } from "../QrCode";
import {
  buildEudiAuthorizationRequestUri,
  type EudiAuthorizationRequestInput,
} from "./build-eudi-authorization-request-uri";
import { getEudiX509HashClientId } from "./eudi-x509-hash-client-id";

/**
 * Props for {@link EUDIQRCode} — EUDI session fields plus optional {@link QrCode} tuning.
 * The verifier `clientId` comes from {@link getEudiX509HashClientId} (env).
 */
export type EUDIQRCodeProps = Omit<EudiAuthorizationRequestInput, "clientId"> &
  Pick<
    QrCodeProps,
    "size" | "quietZone" | "color" | "backgroundColor" | "framed"
  > & {
    /**
     * QR error-correction level. Long HAIP URIs benefit from `Q`.
     * @defaultValue "Q"
     */
    errorCorrectionLevel?: QrCodeProps["errorCorrectionLevel"];
  };

/**
 * Builds a valid EUDI authorization-request URI and renders it as a scannable QR code.
 *
 * @param props - {@link EUDIQRCodeProps}
 */
export function EUDIQRCode({
  requestUri,
  requestUriMethod = 'get',
  scheme = 'openid4vp',
  size,
  quietZone = 4,
  errorCorrectionLevel = "L",
  color,
  backgroundColor,
  framed,
}: EUDIQRCodeProps) {
  const clientId = getEudiX509HashClientId();

  const value = useMemo(
    () =>
      buildEudiAuthorizationRequestUri({
        clientId,
        requestUri,
        requestUriMethod,
        scheme,
      }),
    [clientId, requestUri, requestUriMethod, scheme],
  );

  console.log(requestUri);
  console.log(value);
  // openid4vp://?client_id=x509_hash%3A3uNx62xYFFqo901cuI9ocSqM5L3YWA40IHfj9s7t-rM&request_uri=https%253A%252F%252Fcivia-platform-api.fly.dev%252Fwallet%252Fpresentation%252Fstart%252F3d2fcb97-68a8-4c58-82be-ef07608945b7&request_uri_method=get

  return (
    <QrCode
      value={value}
      size={size}
      quietZone={quietZone}
      errorCorrectionLevel={errorCorrectionLevel}
      color={color}
      backgroundColor={backgroundColor}
      framed={framed}
    />
  );
}
