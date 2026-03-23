/**
 * One Civia introduction step with the flow design: full-viewport wind/water
 * backdrop, glass card, Hero, and inset prose.
 */
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Hero } from "../../../components/Hero";
import { hexToRgba } from "../../../components/ThemePatternBackground/hex-to-rgba";
import { useTheme } from "../../../components/use-theme";
import type { OnboardingFlowStep } from "./civia-intro-flow";
import { OnboardingFlowBackdrop } from "./OnboardingFlowBackdrop";
import { OnboardingProseContent } from "./OnboardingProseContent";

const SCRIM_ALPHA = 0.42;

export type FlowIntroStepViewProps = {
  step: OnboardingFlowStep;
  actions: ReactNode;
};

/**
 * Renders a single intro step with the flow (wind/water) environment.
 */
export function FlowIntroStepView({ step, actions }: FlowIntroStepViewProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const glassFill = hexToRgba(theme.surfaceCard, 0.78);
  const scrimColor = hexToRgba(theme.surfaceCard, SCRIM_ALPHA);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <OnboardingFlowBackdrop width={width} height={height} />
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }]}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <Hero
            eyebrow={step.eyebrow}
            title={step.title}
            subtitle={step.subtitle}
          />
          <View
            style={[
              styles.glassCard,
              {
                backgroundColor: glassFill,
                borderColor: theme.borderDefault,
              },
            ]}
          >
            <OnboardingProseContent blocks={step.prose} animateOnChange />
            <View style={styles.actions}>{actions}</View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: "100%",
    gap: 16,
  },
  actions: {
    gap: 12,
  },
});
