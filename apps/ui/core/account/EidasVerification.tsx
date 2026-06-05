import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../../components/Button";
import { EUDIQRCode } from "../../components/EUDIQRCode";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { Description } from "../../components/Typography";
import { AuthScreen } from "./AuthScreen";
import { buildEudiPresentationRequestUri } from "./eudi-presentation-request-uri";
import { useAccountActions, usePlatformUser } from "./hooks";

export default function EidasVerification() {
  const { completeEidasVerification } = useAccountActions();
  const platformUser = usePlatformUser();
  const [formError, setFormError] = useState<string | null>(null);

  const requestUri = useMemo(() => {
    if (!platformUser?.user_id) {
      return null;
    }
    try {
      return buildEudiPresentationRequestUri(platformUser.user_id);
    } catch (err) {
      return null;
    }
  }, [platformUser?.user_id]);

  const handleContinue = () => {
    setFormError(null);
    try {
      completeEidasVerification();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not finish verification";
      setFormError(message);
    }
  };


  if (!platformUser?.user_id || !requestUri) {
    return (
      <AuthScreen
        eyebrow="Step 4 of 4"
        title="Verify with eIDAS 2.0"
        subtitle="Preparing your wallet presentation request…"
        error={formError}
      >
        <LoadingIndicator size="large" />
        <Description>
          Your platform account must exist before the eIDAS QR code can be
          generated.
        </Description>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Step 4 of 4"
      title="Verify with eIDAS 2.0"
      subtitle="Scan the QR code with your EU Digital Identity Wallet to confirm your identity."
      error={formError}
    >
      <View style={styles.qrWrap}>
        <EUDIQRCode requestUri={requestUri} size={200} framed={false} />
      </View>
      <Button variant="primary" onPress={handleContinue}>
        Continue
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    alignItems: "center",
  },
});
