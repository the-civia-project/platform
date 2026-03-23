import { useState } from "react";
import Button from "../../components/Button";
import { AuthScreen } from "./AuthScreen";
import { useAccountActions, usePlatformRegistrationState } from "./hooks";
import { RegistrationProfileFields } from "./RegistrationProfileFields";
import {
  createDefaultRegistrationProfile,
  isRegistrationProfileReady,
  validateRegistrationProfileFields,
} from "./registration-profile";

export default function CompleteRegistration() {
  const { registerWithProfile } = useAccountActions();
  const { registering, registerError } = usePlatformRegistrationState();
  const [profile, setProfile] = useState(createDefaultRegistrationProfile);
  const [formError, setFormError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);

  const handleContinue = async () => {
    setFormError(null);

    const validation = validateRegistrationProfileFields(profile);
    setHandleError(validation.handleError);
    if (validation.formError || validation.handleError) {
      setFormError(validation.formError);
      return;
    }

    try {
      await registerWithProfile(profile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Platform registration failed";
      setFormError(message);
    }
  };

  const displayError = formError ?? registerError;

  return (
    <AuthScreen
      eyebrow="Step 3 of 3"
      title="Create your account"
      subtitle="Choose your EU country and the @username you will post under."
      error={displayError}
    >
      <RegistrationProfileFields
        value={profile}
        onChange={setProfile}
        handleError={handleError}
      />
      <Button
        variant="primary"
        onPress={handleContinue}
        disabled={registering || !isRegistrationProfileReady(profile)}
      >
        {registering ? "Creating account…" : "Continue"}
      </Button>
    </AuthScreen>
  );
}
