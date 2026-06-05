/**
 * Renders a scannable QR code from a string payload using {@link react-native-svg}.
 * Foreground and background colours follow the active kit theme unless overridden.
 *
 * Reach for this on cross-device flows (eIDAS wallet presentation, deep links,
 * pairing codes) where the payload is already a final URL or token string.
 */
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useTheme } from "../use-theme";
import {
  encodeQrMatrix,
  type QrCodeErrorCorrectionLevel,
} from "./encode-qr-matrix";

/**
 * Props for {@link QrCode}.
 */
export type QrCodeProps = {
  /** String payload encoded into the QR symbol (URL, OID4VP request, etc.). */
  value: string;
  /**
   * Rendered width and height in logical pixels.
   * @defaultValue 160
   */
  size?: number;
  /**
   * Quiet zone around the symbol, in modules (ISO 18004 recommends at least 4).
   * @defaultValue 4
   */
  quietZone?: number;
  /**
   * QR error-correction level passed to the encoder.
   * @defaultValue "M"
   */
  errorCorrectionLevel?: QrCodeErrorCorrectionLevel;
  /** Override for dark modules; defaults to the active theme foreground token. */
  color?: string;
  /**
   * Override for light modules and the outer frame; defaults to the active card surface token.
   */
  backgroundColor?: string;
  /**
   * When true, draws a hairline border and padding around the symbol.
   * @defaultValue true
   */
  framed?: boolean;
};

/**
 * Encodes `value` and paints the resulting QR symbol as an SVG grid.
 *
 * @param props - {@link QrCodeProps}
 */
export function QrCode({
  value,
  size = 160,
  quietZone = 4,
  errorCorrectionLevel = "M",
  color,
  backgroundColor,
  framed = true,
}: QrCodeProps) {
  const theme = useTheme();
  const foreground = color ?? theme.fg;
  const background = backgroundColor ?? theme.surfaceCard;

  const matrix = useMemo(() => {
    try {
      return encodeQrMatrix(value, errorCorrectionLevel);
    } catch {
      return null;
    }
  }, [errorCorrectionLevel, value]);

  const rects = useMemo(() => {
    if (!matrix) {
      return [];
    }

    const moduleCount = matrix.size;
    const totalModules = moduleCount + quietZone * 2;
    const cellSize = size / totalModules;

    const nodes: ReactNode[] = [];

    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (!matrix.isDark(row, column)) {
          continue;
        }

        nodes.push(
          <Rect
            key={`${row}-${column}`}
            x={(column + quietZone) * cellSize}
            y={(row + quietZone) * cellSize}
            width={cellSize}
            height={cellSize}
            fill={foreground}
          />,
        );
      }
    }

    return nodes;
  }, [foreground, matrix, quietZone, size]);

  if (!matrix) {
    return null;
  }

  const symbol = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={background} />
      {rects}
    </Svg>
  );

  if (!framed) {
    return (
      <View accessibilityRole="image" accessibilityLabel="QR code">
        {symbol}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.frame,
        {
          borderColor: theme.borderDefault,
          backgroundColor: background,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="QR code"
    >
      {symbol}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: "flex-start",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
