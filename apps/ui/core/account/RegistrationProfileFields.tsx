import { View } from "react-native";
import Button from "../../components/Button";
import { TextInput } from "../../components/Input";
import { Description } from "../../components/Typography";
import type { RegistrationProfile } from "./registration-profile";
import { generateSuggestedHandle } from "./suggested-handle";
import { authFieldStackStyle } from "./AuthScreen";

export type RegistrationProfileFieldsProps = {
  value: RegistrationProfile;
  onChange: (profile: RegistrationProfile) => void;
  handleError?: string | null;
};

export function RegistrationProfileFields({
  value,
  onChange,
  handleError = null,
}: RegistrationProfileFieldsProps) {
  const fieldStack = authFieldStackStyle();

  return (
    <View style={{ gap: 16 }}>
      <View style={fieldStack}>
        <TextInput
          label="Username"
          value={value.handle}
          onChangeText={(handle) => onChange({ ...value, handle })}
          autoCapitalize="none"
          placeholder="@adjective.animal.number"
        />
        {handleError ? <Description>{handleError}</Description> : null}
        <Description>
          Your public @handle — edit or pick another suggestion. EU citizenship
          is confirmed in the next step with your digital identity wallet.
        </Description>
        <Button
          variant="simple"
          onPress={() => onChange({ ...value, handle: generateSuggestedHandle() })}
        >
          Suggest another username
        </Button>
      </View>
    </View>
  );
}
