import { useSignUp } from "@clerk/expo";
import { useState } from "react";
import { View } from "react-native";
import Button from "../../components/Button";
import { TextInput } from "../../components/Input";
import { Description } from "../../components/Typography";
import { authEmailError } from "./auth-email";
import { resetRootRoute } from "./auth-navigation";
import {
  AuthLinkFooter,
  AuthLoading,
  AuthScreen,
  authFieldStackStyle,
} from "./AuthScreen";

type SignUpEmailVerificationProps = {
  code: string;
  onCodeChange: (code: string) => void;
  codeFieldError?: string;
  formError: string | null;
  busy: boolean;
  onVerify: () => void;
  onResendCode: () => void;
};

function SignUpEmailVerification({
  code,
  onCodeChange,
  codeFieldError,
  formError,
  busy,
  onVerify,
  onResendCode,
}: SignUpEmailVerificationProps) {
  const fieldStack = authFieldStackStyle();

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
          onChangeText={onCodeChange}
          keyboardType="numeric"
          autoCapitalize="none"
        />
        {codeFieldError ? <Description>{codeFieldError}</Description> : null}
      </View>
      <Button variant="primary" onPress={onVerify} disabled={busy || !code}>
        {busy ? "Verifying…" : "Verify and continue"}
      </Button>
      <Button variant="ghost" onPress={onResendCode} disabled={busy}>
        Send a new code
      </Button>
    </AuthScreen>
  );
}

type SignUpCreateAccountProps = {
  emailAddress: string;
  onEmailAddressChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  emailError?: string;
  emailFieldError?: string;
  passwordFieldError?: string;
  formError: string | null;
  busy: boolean;
  onSubmit: () => void;
  onSignInPress: () => void;
};

function SignUpCreateAccount({
  emailAddress,
  onEmailAddressChange,
  password,
  onPasswordChange,
  emailError,
  emailFieldError,
  passwordFieldError,
  formError,
  busy,
  onSubmit,
  onSignInPress,
}: SignUpCreateAccountProps) {
  const fieldStack = authFieldStackStyle();

  return (
    <AuthScreen
      eyebrow="Step 1 of 3"
      title="Create your account"
      subtitle="Sign up with email and password. You will finish registration after verifying your email."
      error={formError}
      footer={
        <AuthLinkFooter
          lead="Already registered?"
          linkLabel="Sign in"
          onPress={onSignInPress}
        />
      }
    >
      <View style={fieldStack}>
        <TextInput
          label="Email"
          type="email"
          value={emailAddress}
          onChangeText={onEmailAddressChange}
          autoCapitalize="none"
          error={emailError}
        />
        {emailFieldError ? <Description>{emailFieldError}</Description> : null}
      </View>
      <View style={fieldStack}>
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChangeText={onPasswordChange}
        />
        {passwordFieldError ? (
          <Description>{passwordFieldError}</Description>
        ) : null}
      </View>
      <Button
        variant="primary"
        onPress={onSubmit}
        disabled={
          busy || !emailAddress || !password || Boolean(emailError)
        }
      >
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </AuthScreen>
  );
}

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const emailError = authEmailError(emailAddress);

  const handleSubmit = async () => {
    setFormError(null);

    const submitEmailError = authEmailError(emailAddress);
    if (submitEmailError) {
      setFormError(submitEmailError);
      return;
    }

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

  if (busy) {
    return <AuthLoading />;
  }

  if (awaitingVerification) {
    return (
      <SignUpEmailVerification
        code={code}
        onCodeChange={setCode}
        codeFieldError={errors.fields.code?.message}
        formError={formError}
        busy={busy}
        onVerify={handleVerify}
        onResendCode={() => signUp.verifications.sendEmailCode()}
      />
    );
  }

  return (
    <SignUpCreateAccount
      emailAddress={emailAddress}
      onEmailAddressChange={setEmailAddress}
      password={password}
      onPasswordChange={setPassword}
      emailError={emailError ?? undefined}
      emailFieldError={errors.fields.emailAddress?.message}
      passwordFieldError={errors.fields.password?.message}
      formError={formError}
      busy={busy}
      onSubmit={handleSubmit}
      onSignInPress={() => resetRootRoute("auth/sign-in")}
    />
  );
}
