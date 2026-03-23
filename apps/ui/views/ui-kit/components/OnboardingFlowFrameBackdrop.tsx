/**
 * Full-frame wind + water backdrop for the flow design variant.
 */
import { StyleSheet, View } from "react-native";
import { hexToRgba } from "../../../components/ThemePatternBackground/hex-to-rgba";
import { useTheme } from "../../../components/use-theme";
import { OnboardingFlowBackdrop } from "./OnboardingFlowBackdrop";

const SCRIM_ALPHA = 0.42;

export type OnboardingFlowFrameBackdropProps = {
  width: number;
  height: number;
};

export function OnboardingFlowFrameBackdrop({
  width,
  height,
}: OnboardingFlowFrameBackdropProps) {
  const theme = useTheme();
  const scrimColor = hexToRgba(theme.surfaceCard, SCRIM_ALPHA);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <OnboardingFlowBackdrop width={width} height={height} />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }]}
      />
    </View>
  );
}
