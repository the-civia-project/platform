import { useSignIn } from "@clerk/expo";
import { useState } from "react";
import { View } from "react-native";
import Button from "../../components/Button";
import { TextInput } from "../../components/Input";
import { Description } from "../../components/Typography";
import { resetRootRoute } from "./auth-navigation";
import {
  AuthLinkFooter,
  AuthScreen,
  authFieldStackStyle,
} from "./AuthScreen";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const fieldStack = authFieldStackStyle();

  const handleSubmit = async () => {
    setFormError(null);
    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });
    if (error) {
      setFormError(error.message ?? "Sign in failed");
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize();
    }
  };

  const handleVerify = async () => {
    setFormError(null);
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize();
    }
  };

  if (signIn.status === "needs_client_trust") {
    return (
      <AuthScreen
        eyebrow="Security check"
        title="Verify this device"
        subtitle="We sent a one-time code to your email. Enter it below to finish signing in."
        error={formError}
      >
        <View style={fieldStack}>
          <TextInput
            label="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            autoCapitalize="none"
          />
          {errors.fields.code ? (
            <Description>{errors.fields.code.message}</Description>
          ) : null}
        </View>
        <Button variant="primary" onPress={handleVerify} disabled={busy || !code}>
          {busy ? "Verifying…" : "Verify and continue"}
        </Button>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="The Civia Project"
      title="Welcome back"
      subtitle="Sign in to The Civia Platform — your civic feed, compose, and community in one place."
      hint="Secure access powered by Clerk. Your platform account syncs after sign-in."
      error={formError}
      footer={
        <AuthLinkFooter
          lead="No account yet?"
          linkLabel="Create one"
          onPress={() => resetRootRoute("auth/sign-up")}
        />
      }
    >
      <View style={fieldStack}>
        <TextInput
          label="Email"
          type="email"
          value={emailAddress}
          onChangeText={setEmailAddress}
          autoCapitalize="none"
        />
        {errors.fields.identifier ? (
          <Description>{errors.fields.identifier.message}</Description>
        ) : null}
      </View>
      <View style={fieldStack}>
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChangeText={setPassword}
        />
        {errors.fields.password ? (
          <Description>{errors.fields.password.message}</Description>
        ) : null}
      </View>
      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={busy || !emailAddress || !password}
      >
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </AuthScreen>
  );
}
