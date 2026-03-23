import { View } from "react-native";
import { TextInput } from "../../../components/Input";
import { Description } from "../../../components/Typography";
import { authFieldStackStyle } from "../AuthScreen";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

export type ProfileOnboardingNameStepProps = {
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
  nameError?: string | null;
};

export function ProfileOnboardingNameStep({
  draft,
  onChange,
  nameError = null,
}: ProfileOnboardingNameStepProps) {
  const fieldStack = authFieldStackStyle();

  return (
    <View style={fieldStack}>
      <TextInput
        label="Display name"
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        placeholder="How you want to be called"
        autoFocus
      />
      {nameError ? <Description>{nameError}</Description> : null}
    </View>
  );
}
