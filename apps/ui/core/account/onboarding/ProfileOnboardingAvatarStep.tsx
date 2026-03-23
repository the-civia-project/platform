import { View } from "react-native";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";
import { Description } from "../../../components/Typography";
import { resolveProfileOnboardingAvatar } from "./profile-onboarding-avatar";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

export type ProfileOnboardingAvatarStepProps = {
  draft: ProfileOnboardingDraft;
  handleSeed: string;
  onPickAvatar: () => void;
};

export function ProfileOnboardingAvatarStep({
  draft,
  handleSeed,
  onPickAvatar,
}: ProfileOnboardingAvatarStepProps) {
  const avatarSource = resolveProfileOnboardingAvatar(draft, handleSeed);

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Avatar
        source={avatarSource}
        size="xl"
        shape="round"
        accessibilityLabel="Profile photo preview"
      />
      <Button variant="ghost" onPress={onPickAvatar}>
        {draft.localAvatarUri ? "Choose another photo" : "Choose a photo"}
      </Button>
      <Description>
        Preview only — if you skip, we keep the avatar generated from{" "}
        {handleSeed}.
      </Description>
    </View>
  );
}
