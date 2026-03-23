import { Pressable, View } from "react-native";
import { TextInput } from "../../components/Input";
import { Select } from "../../components/Select";
import { Description, Strong } from "../../components/Typography";
import { citizenshipSelectOptions } from "./countries";
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
      <Select
        label="EU country"
        sheetTitle="EU country"
        placeholder="Select country"
        options={citizenshipSelectOptions()}
        value={value.citizenOf}
        onChange={(citizenOf) => onChange({ ...value, citizenOf })}
      />

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
          Your public @handle — edit or pick another suggestion.
        </Description>
        <Pressable
          onPress={() => onChange({ ...value, handle: generateSuggestedHandle() })}
          accessibilityRole="button"
        >
          <Strong>Suggest another username</Strong>
        </Pressable>
      </View>
    </View>
  );
}
