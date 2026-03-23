import { View } from "react-native";
import { TextInput } from "../../../components/Input";
import { Description } from "../../../components/Typography";
import { authFieldStackStyle } from "../AuthScreen";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

export type ProfileOnboardingLocationStepProps = {
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
  locationError?: string | null;
};

export function ProfileOnboardingLocationStep({
  draft,
  onChange,
  locationError = null,
}: ProfileOnboardingLocationStepProps) {
  const fieldStack = authFieldStackStyle();

  return (
    <View style={fieldStack}>
      <TextInput
        label="Location"
        value={draft.location}
        onChangeText={(location) => onChange({ ...draft, location })}
        placeholder="e.g. Berlin, Germany"
        autoFocus
      />
      {locationError ? <Description>{locationError}</Description> : null}
    </View>
  );
}
