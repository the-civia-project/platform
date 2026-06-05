/**
 * UI Kit screen for {@link QrCode} and {@link EUDIQRCode}. Documents generic
 * payloads and HAIP cross-device wallet presentation requests.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { EUDIQRCode } from "../../components/EUDIQRCode";
import { QrCode } from "../../components/QrCode";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
} from "../../components/Typography";

type QrCodeRow = ExampleBlockProps & { key: string };

const DEMO_URL = "https://platform.civia.example/auth/eidas-verification";
const EUDI_REQUEST_URI =
  "https://platform.theciviaproject.org/wallet/request.jwt/demo-session";

/**
 * Default-exported screen registered with the UI Kit stack as `qr-code`.
 */
export default function QrCodeScreen() {
  const genericRows: QrCodeRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "default",
        summary: (
          <Description>
            Encodes a URL at the default 160&nbsp;px size with themed foreground
            and a framed quiet zone.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<QrCode value="${DEMO_URL}" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <QrCode value={DEMO_URL} />
          </View>
        ),
      },
      {
        key: "compact",
        name: "compact",
        summary: (
          <Description>
            Smaller symbol without the outer frame — useful inline beside copy
            or inside dense auth cards.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<QrCode value="${DEMO_URL}" size={96} framed={false} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <QrCode value={DEMO_URL} size={96} framed={false} />
          </View>
        ),
      },
    ],
    [],
  );

  const eudiRows: QrCodeRow[] = useMemo(
    () => [
      {
        key: "haip-presentation",
        name: "haip-presentation",
        summary: (
          <Description>
            Builds a HAIP <Code>haip-vp://</Code> authorization-request URI.
            The verifier <Code>clientId</Code> comes from{" "}
            <Code>EXPO_PUBLIC_EUDI_X509_HASH_CLIENT_ID</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<EUDIQRCode requestUri="${EUDI_REQUEST_URI}" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <EUDIQRCode requestUri={EUDI_REQUEST_URI} size={200} />
          </View>
        ),
      },
      {
        key: "openid4vp-get",
        name: "openid4vp-get",
        summary: (
          <Description>
            Generic <Code>openid4vp://</Code> scheme with{" "}
            <Code>request_uri_method="get"</Code> for interoperable verifier
            endpoints.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<EUDIQRCode requestUri="https://…" requestUriMethod="get" scheme="openid4vp" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sample}>
            <EUDIQRCode
              requestUri="https://civia-platform-api.fly.dev/wallet/presentation/start/3d7fe4d0-2924-4d70-96d2-3273d75a88b6"
              requestUriMethod="get"
              scheme="openid4vp"
              size={200}
            />
          </View>
        ),
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        Scannable QR codes rendered with SVG. Use <Code>QrCode</Code> for arbitrary
        string payloads; use <Code>EUDIQRCode</Code> with a verifier{" "}
        <Code>requestUri</Code> — the <Code>x509_hash:</Code> client id is read
        from <Code>EXPO_PUBLIC_EUDI_X509_HASH_CLIENT_ID</Code>.
      </Lede>
      <Section title="Generic payloads">
        {genericRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === genericRows.length - 1}
          />
        ))}
      </Section>
      <Section title="EUDI wallet presentation">
        {eudiRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === eudiRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  sample: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
