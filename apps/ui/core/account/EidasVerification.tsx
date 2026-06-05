import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EUDIQRCode } from "../../components/EUDIQRCode";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import Pill from "../../components/Pill";
import { Description } from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import { AuthScreen } from "./AuthScreen";
import { buildEudiPresentationRequestUri } from "./eudi-presentation-request-uri";
import { usePlatformUser, usePollPlatformCitizenship } from "./hooks";

function EidasReloadNotice() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: theme.surfaceSubtle,
        },
      ]}
    >
      <View style={styles.noticeHeader}>
        <Text style={[styles.noticeEyebrow, { color: theme.primary }]}>
          Waiting for your wallet
        </Text>
      </View>
      <Description>
        This page will reload automatically once eIDAS 2.0 validation is
        finished.
      </Description>
    </View>
  );
}

export default function EidasVerification() {
  const platformUser = usePlatformUser();
  usePollPlatformCitizenship();

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

  if (!platformUser?.user_id || !requestUri) {
    return (
      <AuthScreen
        eyebrow="Step 4 of 4"
        title="Verify with eIDAS 2.0"
        subtitle="Preparing your wallet presentation request…"
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
    >
      <View style={styles.walletRequest}>
        <View style={styles.weWillGet}>
          <Description>We will require all our users to share with us their</Description>
          <Pill variant="muted">Nationalities</Pill>
        </View>
        <View style={styles.qrWrap}>
          <EUDIQRCode requestUri={requestUri} size={200} framed={false} />
        </View>
        <Description>
          We will display your nationality to others when you post publicly.
          Your wallet will ask you to approve before anything is shared with
          The Civia Platform.
        </Description>
      </View>
      <EidasReloadNotice />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    alignItems: "center",
  },
  walletRequest: {
    gap: 8,
  },
  weWillGet: {
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  notice: {
    marginTop: 4,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeEyebrow: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
