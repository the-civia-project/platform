/**
 * Pure QR matrix encoding for {@link QrCode}. Wraps the `qrcode` package so
 * rendering and tests share one code path.
 */
import QRCode from "qrcode";

/** Error-correction presets accepted by {@link encodeQrMatrix}. */
export type QrCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/** Square module grid returned by {@link encodeQrMatrix}. */
export type QrCodeMatrix = {
  /** Side length in modules (excluding quiet zone). */
  size: number;
  /** Returns true when the module at `(row, column)` should be painted dark. */
  isDark: (row: number, column: number) => boolean;
};

/**
 * Encodes `value` into a QR module matrix suitable for SVG rendering.
 *
 * @param value - Payload to encode. Must be non-empty.
 * @param errorCorrectionLevel - QR recovery level; `M` balances density and resilience.
 */
export function encodeQrMatrix(
  value: string,
  errorCorrectionLevel: QrCodeErrorCorrectionLevel = "M",
): QrCodeMatrix {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("QrCode value must be a non-empty string.");
  }

  const qr = QRCode.create(trimmed, { errorCorrectionLevel });
  const size = qr.modules.size;

  return {
    size,
    isDark: (row, column) => Boolean(qr.modules.get(row, column)),
  };
}
