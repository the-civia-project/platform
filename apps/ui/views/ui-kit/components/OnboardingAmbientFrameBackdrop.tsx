/**
 * Full-frame ThemePatternBackground + scrim for the ambient flow design.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import ThemePatternBackground from "../../../components/ThemePatternBackground";
import { hexToRgba } from "../../../components/ThemePatternBackground/hex-to-rgba";
import { useTheme } from "../../../components/use-theme";

const PATTERN_OPACITY_MIN = 0.55;
const PATTERN_OPACITY_MAX = 1;
const SCRIM_ALPHA = 0.38;
const BREATHE_MS = 4000;

export type OnboardingAmbientFrameBackdropProps = {
  width: number;
  height: number;
};

export function OnboardingAmbientFrameBackdrop({
  width,
  height,
}: OnboardingAmbientFrameBackdropProps) {
  const theme = useTheme();
  const breathe = useRef(new Animated.Value(0)).current;
  const scrimColor = hexToRgba(theme.surfaceCard, SCRIM_ALPHA);
  const patternOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [PATTERN_OPACITY_MIN, PATTERN_OPACITY_MAX],
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: BREATHE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: BREATHE_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: patternOpacity }]}>
        <ThemePatternBackground width={width} height={height} />
      </Animated.View>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
