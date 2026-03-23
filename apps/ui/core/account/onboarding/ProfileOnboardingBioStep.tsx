import { View } from "react-native";
import { TextArea } from "../../../components/Input";
import { Description } from "../../../components/Typography";
import { authFieldStackStyle } from "../AuthScreen";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

export type ProfileOnboardingBioStepProps = {
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
  bioError?: string | null;
};

export function ProfileOnboardingBioStep({
  draft,
  onChange,
  bioError = null,
}: ProfileOnboardingBioStepProps) {
  const fieldStack = authFieldStackStyle();

  return (
    <View style={fieldStack}>
      <TextArea
        label="Bio"
        value={draft.bio}
        onChangeText={(bio) => onChange({ ...draft, bio })}
        placeholder="A short description of what you post about"
        minRows={4}
        maxRows={8}
        autoFocus
      />
      {bioError ? <Description>{bioError}</Description> : null}
    </View>
  );
}
