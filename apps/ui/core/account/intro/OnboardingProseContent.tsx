/**
 * Inset prose body for onboarding steps — typography only; backdrop is on the flow design.
 */
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Description, Strong } from "../../../components/Typography";
import { useTheme } from "../../../components/use-theme";
import type { OnboardingProseBlock } from "./civia-intro-flow";

const ENTER_MS = 350;

export type OnboardingProseContentProps = {
  blocks: readonly OnboardingProseBlock[];
  /** When true, prose fades in when `blocks` change. */
  animateOnChange?: boolean;
};

function blocksKey(blocks: readonly OnboardingProseBlock[]): string {
  return blocks
    .map((b) =>
      b.kind === "paragraph" ? `p:${b.text}` : `pt:${b.lead}:${b.text}`,
    )
    .join("\n");
}

function ProseBlock({ block }: { block: OnboardingProseBlock }) {
  if (block.kind === "paragraph") {
    return <Description>{block.text}</Description>;
  }

  return (
    <View style={styles.point}>
      <Strong>{block.lead}</Strong>
      <Description>{block.text}</Description>
    </View>
  );
}

/**
 * Inset prose panel used inside flow (and kit) onboarding steps.
 */
export function OnboardingProseContent({
  blocks,
  animateOnChange = false,
}: OnboardingProseContentProps) {
  const theme = useTheme();
  const contentKey = useMemo(() => blocksKey(blocks), [blocks]);
  const enter = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animateOnChange) {
      return;
    }
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [animateOnChange, contentKey, enter]);

  const body = (
    <View
      style={[
        styles.inset,
        {
          borderColor: theme.borderDefault,
          backgroundColor: theme.surfaceSubtle,
        },
      ]}
    >
      {blocks.map((block, index) => (
        <View key={index} style={styles.block}>
          <ProseBlock block={block} />
        </View>
      ))}
    </View>
  );

  if (!animateOnChange) {
    return body;
  }

  return <Animated.View style={{ opacity: enter }}>{body}</Animated.View>;
}

const styles = StyleSheet.create({
  inset: {
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  block: {
    gap: 14,
  },
  point: {
    gap: 4,
  },
});
