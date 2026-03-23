import { useSignUp } from "@clerk/expo";
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

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const fieldStack = authFieldStackStyle();

  const handleSubmit = async () => {
    setFormError(null);

    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
    });
    if (error) {
      setFormError(error.message ?? "Sign up failed");
      return;
    }

    const send = await signUp.verifications.sendEmailCode();
    if (send.error) {
      setFormError(send.error.message ?? "Could not send verification email");
    }
  };

  const handleVerify = async () => {
    setFormError(null);

    const verify = await signUp.verifications.verifyEmailCode({ code });
    if (verify.error) {
      setFormError(verify.error.message ?? "Verification failed");
      return;
    }
    if (signUp.status !== "complete") {
      setFormError("Sign-up is not complete yet.");
      return;
    }

    await signUp.finalize();
  };

  const awaitingVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address");

  if (awaitingVerification) {
    return (
      <AuthScreen
        eyebrow="Step 2 of 3"
        title="Validate your account"
        subtitle="Enter the verification code we sent to your email."
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
        <Button
          variant="primary"
          onPress={handleVerify}
          disabled={busy || !code}
        >
          {busy ? "Verifying…" : "Verify and continue"}
        </Button>
        <Button
          variant="ghost"
          onPress={() => signUp.verifications.sendEmailCode()}
          disabled={busy}
        >
          Send a new code
        </Button>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Step 1 of 3"
      title="Create your account"
      subtitle="Sign up with email and password. You will set up your profile after verifying your email."
      error={formError}
      footer={
        <AuthLinkFooter
          lead="Already registered?"
          linkLabel="Sign in"
          onPress={() => resetRootRoute("auth/sign-in")}
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
        {errors.fields.emailAddress ? (
          <Description>{errors.fields.emailAddress.message}</Description>
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
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </AuthScreen>
  );
}
