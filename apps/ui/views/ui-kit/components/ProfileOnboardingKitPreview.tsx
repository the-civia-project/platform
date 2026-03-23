/**
 * Kit-internal preview for post-registration profile onboarding — seven steps
 * with step pills and prev/next. No API calls; draft is local.
 */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Button from "../../../components/Button";
import { Card } from "../../../components/card/Card";
import { Cluster } from "../../../components/Cluster";
import { Hero } from "../../../components/Hero";
import { ToggleButton } from "../../../components/ToggleButton";
import { useTheme } from "../../../components/use-theme";
import { ProfileOnboardingStepContent } from "../../../core/account/onboarding/profile-onboarding-step-content";
import {
  createDefaultProfileOnboardingDraft,
  type ProfileOnboardingDraft,
} from "../../../core/account/onboarding/profile-onboarding-draft";
import { ProfileOnboardingOptionalPill } from "../../../core/account/onboarding/ProfileOnboardingOptionalPill";
import {
  PROFILE_ONBOARDING_SKIP_LABEL,
  PROFILE_ONBOARDING_STEPS,
  profileOnboardingStepIsOptional,
  profileOnboardingStepShowsSkip,
} from "../../../core/account/onboarding/profile-onboarding-steps";
import { PROFILE_ONBOARDING_KIT_HANDLE } from "../profile-onboarding-kit-flows";

const PREVIEW_WIDTH = 440;
const PREVIEW_HEIGHT = 560;

function KitActions({
  onContinue,
  onSkip,
  continueLabel,
  showSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
  continueLabel: string;
  showSkip: boolean;
}) {
  return (
    <View style={styles.actions}>
      <Button variant="primary" onPress={onContinue}>
        {continueLabel}
      </Button>
      {showSkip ? (
        <Button variant="ghost" onPress={onSkip}>
          {PROFILE_ONBOARDING_SKIP_LABEL}
        </Button>
      ) : null}
    </View>
  );
}

/**
 * Interactive preview of the product profile-onboarding stepper.
 */
export function ProfileOnboardingKitPreview() {
  const theme = useTheme();
  const [draft, setDraft] = useState(createDefaultProfileOnboardingDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = PROFILE_ONBOARDING_STEPS;
  const step = steps[stepIndex] ?? steps[0];
  const isLastStep = stepIndex >= steps.length - 1;

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        label: s.id,
        slug: s.id,
      })),
    [steps],
  );

  if (!step) {
    return null;
  }

  const advance = () => {
    if (isLastStep) {
      return;
    }
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
  };

  const showSkip = profileOnboardingStepShowsSkip(step.id);

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <ToggleButton
          options={stepOptions}
          value={step.id}
          onChange={(slug) => {
            const idx = steps.findIndex((s) => s.id === slug);
            if (idx >= 0) {
              setStepIndex(idx);
            }
          }}
          variant="ghost"
        />
        <Cluster>
          <Button
            variant="ghost"
            onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            onPress={() =>
              setStepIndex((i) => Math.min(steps.length - 1, i + 1))
            }
            disabled={stepIndex >= steps.length - 1}
          >
            Next
          </Button>
        </Cluster>
      </View>
      <View
        style={[
          styles.frame,
          {
            borderColor: theme.borderDefault,
            backgroundColor: theme.surfaceCard,
          },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Hero
            eyebrow={step.eyebrow}
            title={step.title}
            subtitle={step.subtitle}
            titleLeading={
              profileOnboardingStepIsOptional(step.id) ? (
                <ProfileOnboardingOptionalPill />
              ) : undefined
            }
          />
          <Card>
            <View style={styles.form}>
              <ProfileOnboardingStepContent
                stepId={step.id}
                draft={draft}
                handleSeed={PROFILE_ONBOARDING_KIT_HANDLE}
                onChange={setDraft}
                onPickAvatar={() => {}}
                onOpenProfileSettings={() => {}}
              />
              <KitActions
                onContinue={advance}
                onSkip={advance}
                continueLabel={
                  isLastStep ? "Enter The Civia Platform" : "Continue"
                }
                showSkip={showSkip}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 12,
  },
  controls: {
    gap: 10,
  },
  frame: {
    width: "100%",
    maxWidth: PREVIEW_WIDTH,
    alignSelf: "center",
    maxHeight: PREVIEW_HEIGHT,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  form: {
    gap: 16,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
});
