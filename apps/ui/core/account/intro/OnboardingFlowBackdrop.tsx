/**
 * Wind + water backdrop for the flow onboarding design. Slow horizontal wave drift
 * and soft wind strokes — decorative only (`pointerEvents` off).
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { hexToRgba } from "../../../components/ThemePatternBackground/hex-to-rgba";
import { useTheme } from "../../../components/use-theme";

const TILE_W = 440;
const WAVE_H = 112;
const WAVE_LOOP_MS = 14000;
const WAVE_LOOP_MS_SLOW = 20000;
const WIND_LOOP_MS = 9000;
const WIND_DRIFT_PX = 48;

export type OnboardingFlowBackdropProps = {
  width: number;
  height: number;
};

function WaveTile({
  fill,
  fillSecondary,
  phase,
}: {
  fill: string;
  fillSecondary: string;
  phase: "a" | "b";
}) {
  const crest =
    phase === "a"
      ? "M0 52 C 73 28, 147 72, 220 48 S 367 32, 440 56 L440 112 L0 112 Z"
      : "M0 44 C 88 68, 176 24, 264 52 S 396 76, 440 40 L440 112 L0 112 Z";
  const swell =
    phase === "a"
      ? "M0 68 C 110 88, 220 58, 330 78 S 400 92, 440 72 L440 112 L0 112 Z"
      : "M0 76 C 95 56, 190 90, 285 64 S 370 48, 440 80 L440 112 L0 112 Z";

  return (
    <Svg width={TILE_W} height={WAVE_H} viewBox={`0 0 ${TILE_W} ${WAVE_H}`}>
      <Path d={crest} fill={fill} />
      <Path d={swell} fill={fillSecondary} />
    </Svg>
  );
}

function WindStrokes({
  stroke,
  width,
}: {
  stroke: string;
  width: number;
}) {
  return (
    <Svg
      width={width}
      height={WAVE_H}
      viewBox={`0 0 ${TILE_W} ${WAVE_H}`}
      style={styles.windSvg}
    >
      <Path
        d="M-20 18 Q 90 6, 200 22 T 460 14"
        stroke={stroke}
        strokeWidth={1.25}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M-40 42 Q 70 58, 180 38 T 420 48"
        stroke={stroke}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
      <Path
        d="M0 8 Q 120 28, 240 12 T 480 20"
        stroke={stroke}
        strokeWidth={0.85}
        fill="none"
        strokeLinecap="round"
        opacity={0.45}
      />
    </Svg>
  );
}

/**
 * Animated wind streaks and looping water tiles.
 */
export function OnboardingFlowBackdrop({
  width,
  height,
}: OnboardingFlowBackdropProps) {
  const theme = useTheme();
  const waveShift = useRef(new Animated.Value(0)).current;
  const waveShiftSlow = useRef(new Animated.Value(0)).current;
  const windShift = useRef(new Animated.Value(0)).current;
  const windFade = useRef(new Animated.Value(0)).current;

  const waterDeep = hexToRgba(theme.primary, 0.14);
  const waterShallow = hexToRgba(theme.primary, 0.08);
  const waterDeepB = hexToRgba(theme.borderSubtle, 0.12);
  const waterShallowB = hexToRgba(theme.borderSubtle, 0.06);
  const windStroke = hexToRgba(theme.primary, 0.22);

  useEffect(() => {
    const waveFast = Animated.loop(
      Animated.timing(waveShift, {
        toValue: 1,
        duration: WAVE_LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    const waveSlow = Animated.loop(
      Animated.timing(waveShiftSlow, {
        toValue: 1,
        duration: WAVE_LOOP_MS_SLOW,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    const windDrift = Animated.loop(
      Animated.timing(windShift, {
        toValue: 1,
        duration: WIND_LOOP_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    );
    const windPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(windFade, {
          toValue: 1,
          duration: WIND_LOOP_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(windFade, {
          toValue: 0,
          duration: WIND_LOOP_MS / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    waveFast.start();
    waveSlow.start();
    windDrift.start();
    windPulse.start();

    return () => {
      waveFast.stop();
      waveSlow.stop();
      windDrift.stop();
      windPulse.stop();
    };
  }, [waveShift, waveShiftSlow, windShift, windFade]);

  const waveTx = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -TILE_W],
  });
  const waveTxSlow = waveShiftSlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -TILE_W],
  });
  const windTx = windShift.interpolate({
    inputRange: [0, 1],
    outputRange: [-WIND_DRIFT_PX, WIND_DRIFT_PX],
  });
  const windOpacity = windFade.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <View style={[styles.clip, { width, height }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.windLayer,
          {
            opacity: windOpacity,
            transform: [{ translateX: windTx }],
          },
        ]}
      >
        <WindStrokes stroke={windStroke} width={width} />
      </Animated.View>

      <View style={styles.waveStack}>
        <Animated.View
          style={[styles.waveRow, { transform: [{ translateX: waveTxSlow }] }]}
        >
          <WaveTile
            phase="b"
            fill={waterDeepB}
            fillSecondary={waterShallowB}
          />
          <WaveTile
            phase="b"
            fill={waterDeepB}
            fillSecondary={waterShallowB}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.waveRow,
            styles.waveRowFront,
            { transform: [{ translateX: waveTx }] },
          ]}
        >
          <WaveTile phase="a" fill={waterDeep} fillSecondary={waterShallow} />
          <WaveTile phase="a" fill={waterDeep} fillSecondary={waterShallow} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  windLayer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    height: 72,
  },
  windSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  waveStack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: WAVE_H,
    overflow: "hidden",
  },
  waveRow: {
    position: "absolute",
    left: 0,
    bottom: 0,
    flexDirection: "row",
    width: TILE_W * 2,
  },
  waveRowFront: {
    bottom: 4,
  },
});
