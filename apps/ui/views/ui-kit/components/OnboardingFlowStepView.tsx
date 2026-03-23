/**
 * Renders one onboarding step for a given {@link OnboardingFlowDesignVariant} —
 * classic uses {@link AuthScreen}; ambient and flow use a glass card over a
 * full-frame backdrop.
 */
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Hero } from "../../../components/Hero";
import { hexToRgba } from "../../../components/ThemePatternBackground/hex-to-rgba";
import type { OnboardingFlowDesignVariant } from "../onboarding-flow-design-variants";
import type { OnboardingFlowStep } from "../onboarding-flows";
import { AuthScreen } from "../../../core/account/AuthScreen";
import { useTheme } from "../../../components/use-theme";
import { OnboardingProseContent } from "./OnboardingProseContent";

export type OnboardingFlowStepViewProps = {
  step: OnboardingFlowStep;
  design: OnboardingFlowDesignVariant;
  actions: ReactNode;
};

function GlassCardBody({
  step,
  actions,
}: {
  step: OnboardingFlowStep;
  actions: ReactNode;
}) {
  return (
    <>
      <OnboardingProseContent blocks={step.prose} animateOnChange />
      {actions}
    </>
  );
}

function AtmosphericStep({
  step,
  actions,
}: {
  step: OnboardingFlowStep;
  actions: React.ReactNode;
}) {
  const theme = useTheme();
  const glassFill = hexToRgba(theme.surfaceCard, 0.78);

  return (
    <View style={styles.atmosphericRoot}>
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
            <GlassCardBody step={step} actions={actions} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Single step surface for {@link FlowStepPreview}.
 */
export function OnboardingFlowStepView({
  step,
  design,
  actions,
}: OnboardingFlowStepViewProps) {
  if (design === "classic") {
    return (
      <AuthScreen
        eyebrow={step.eyebrow}
        title={step.title}
        subtitle={step.subtitle}
      >
        <OnboardingProseContent blocks={step.prose} animateOnChange />
        {actions}
      </AuthScreen>
    );
  }

  return <AtmosphericStep step={step} actions={actions} />;
}

const styles = StyleSheet.create({
  atmosphericRoot: {
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
});
