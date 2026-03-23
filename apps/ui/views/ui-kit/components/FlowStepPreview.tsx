/**
 * Kit-internal stepper for the Civia introduction flow. Each
 * {@link OnboardingFlowDesignVariant} styles the full step (hero, prose, CTA).
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../../../components/Button";
import { Cluster } from "../../../components/Cluster";
import { ToggleButton } from "../../../components/ToggleButton";
import { useTheme } from "../../../components/use-theme";
import type { OnboardingFlowDesignVariant } from "../onboarding-flow-design-variants";
import type {
  OnboardingFlow,
  OnboardingFlowBodyKind,
} from "../onboarding-flows";
import { OnboardingAmbientFrameBackdrop } from "./OnboardingAmbientFrameBackdrop";
import { OnboardingFlowFrameBackdrop } from "./OnboardingFlowFrameBackdrop";
import { OnboardingFlowStepView } from "./OnboardingFlowStepView";

const PREVIEW_WIDTH = 440;
const PREVIEW_HEIGHT = 560;

export type FlowStepPreviewProps = {
  /** Ordered steps to preview; drives pills and prev/next bounds. */
  flow: OnboardingFlow;
  /**
   * Full-flow visual design.
   * @defaultValue `"classic"`
   */
  designVariant?: OnboardingFlowDesignVariant;
};

function StepActions({
  kind,
  compact,
}: {
  kind: OnboardingFlowBodyKind;
  compact?: boolean;
}) {
  const theme = useTheme();

  switch (kind) {
    case "civia-is":
    case "civia-is-not":
      return (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <View
            style={[styles.actionsRule, { backgroundColor: theme.borderDefault }]}
          />
          <Button variant="primary" disabled>
            Continue
          </Button>
        </View>
      );
    case "civia-account":
      return (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <View
            style={[styles.actionsRule, { backgroundColor: theme.borderDefault }]}
          />
          <Button variant="primary" disabled>
            Sign in
          </Button>
          <Button variant="ghost" disabled>
            Create account
          </Button>
        </View>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function FrameBackdrop({ design }: { design: OnboardingFlowDesignVariant }) {
  if (design === "ambient") {
    return (
      <OnboardingAmbientFrameBackdrop
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
      />
    );
  }
  if (design === "flow") {
    return (
      <OnboardingFlowFrameBackdrop
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
      />
    );
  }
  return null;
}

/**
 * Interactive preview for one {@link OnboardingFlow}: step pills, prev/next, and a
 * clipped sample for the active step.
 */
export function FlowStepPreview({
  flow,
  designVariant = "classic",
}: FlowStepPreviewProps) {
  const theme = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = flow.steps;
  const step = steps[stepIndex] ?? steps[0];

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        label: s.label,
        slug: s.id,
      })),
    [steps],
  );

  const activeSlug = step?.id ?? steps[0]?.id ?? "";

  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  if (!step) {
    return null;
  }

  const atmospheric = designVariant !== "classic";

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <ToggleButton
          options={stepOptions}
          value={activeSlug}
          onChange={(slug) => {
            const idx = steps.findIndex((s) => s.id === slug);
            if (idx >= 0) {
              setStepIndex(idx);
            }
          }}
          variant="ghost"
        />
        <Cluster>
          <Button variant="ghost" onPress={goPrev} disabled={stepIndex === 0}>
            Previous
          </Button>
          <Button
            variant="ghost"
            onPress={goNext}
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
            backgroundColor: atmospheric
              ? "transparent"
              : theme.surfaceCard,
          },
        ]}
      >
        <FrameBackdrop design={designVariant} />
        <View style={styles.preview}>
          <OnboardingFlowStepView
            step={step}
            design={designVariant}
            actions={
              <StepActions kind={step.body} compact={atmospheric} />
            }
          />
        </View>
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
  preview: {
    height: PREVIEW_HEIGHT,
    width: "100%",
  },
  actions: {
    gap: 16,
    marginTop: 20,
  },
  actionsCompact: {
    marginTop: 4,
  },
  actionsRule: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
