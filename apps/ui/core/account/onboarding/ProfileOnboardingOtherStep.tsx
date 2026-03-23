import { Pressable, View } from "react-native";
import { Description, Strong } from "../../../components/Typography";
import { OnboardingProseContent } from "../intro/OnboardingProseContent";

export type ProfileOnboardingOtherStepProps = {
  onOpenProfileSettings: () => void;
};

export function ProfileOnboardingOtherStep({
  onOpenProfileSettings,
}: ProfileOnboardingOtherStepProps) {
  return (
    <View style={{ gap: 16 }}>
      <OnboardingProseContent
        blocks={[
          {
            kind: "paragraph",
            text: "You do not need to fill in everything now. Other profile details — links, references, and anything else we add later — live in profile settings.",
          },
          {
            kind: "point",
            lead: "Profile settings",
            text: "Open Settings → Profile to update your public profile whenever you are ready.",
          },
        ]}
      />
      <Pressable
        onPress={onOpenProfileSettings}
        accessibilityRole="link"
      >
        <Strong>Go to profile settings</Strong>
      </Pressable>
      <Description>
        You can finish onboarding first — nothing on these steps is saved yet.
      </Description>
    </View>
  );
}
