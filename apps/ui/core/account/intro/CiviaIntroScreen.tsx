/**
 * Guest introduction before sign-in or sign-up: three steps with the flow
 * (wind/water) design, then navigation to auth screens.
 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../../../components/Button";
import { civiaIntroFlow } from "./civia-intro-flow";
import { FlowIntroStepView } from "./FlowIntroStepView";
import { useAccountActions } from "../hooks";

export default function CiviaIntroScreen() {
  const { completeIntro } = useAccountActions();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = civiaIntroFlow.steps;
  const step = steps[stepIndex] ?? steps[0];

  if (!step) {
    return null;
  }

  const actions =
    step.body === "civia-account" ? (
      <>
        <Button variant="primary" onPress={() => completeIntro("auth/sign-up")}>
          Create account
        </Button>
        <Button variant="ghost" onPress={() => completeIntro("auth/sign-in")}>
          Sign in
        </Button>
      </>
    ) : (
      <Button
        variant="primary"
        onPress={() =>
          setStepIndex((index) => Math.min(steps.length - 1, index + 1))
        }
      >
        Continue
      </Button>
    );

  return (
    <View style={styles.root}>
      <FlowIntroStepView step={step} actions={actions} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
});
