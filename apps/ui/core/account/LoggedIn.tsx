import { useAuth } from "@clerk/expo";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { AccountCtx, useAccountContext } from "./account-context";
import { resetRootRoute, type RootAuthRoute } from "./auth-navigation";
import {
  useIsAuthReady,
  useIsGuestAuthScreen,
  useIsLoggedIn,
  useIsPendingPlatformSync,
  useNeedsCiviaIntro,
  useNeedsCompleteRegistration,
  useNeedsEidasVerification,
} from "./hooks";
import {
  fetchPlatformMe,
  registerPlatformUser,
  type PlatformUser,
  type RegisterPlatformUserInput,
} from "./platform-api";
import type { RegistrationProfile } from "./registration-profile";
import {
  isRegistrationProfileReady,
  prepareRegistrationProfileForApi,
} from "./registration-profile";

async function resolveSessionToken(
  getToken: () => Promise<string | null>,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = await getToken();
    if (token) {
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
  }
  throw new Error("Clerk session is not ready yet. Try again in a moment.");
}

function AuthNavigationSync() {
  const authReady = useIsAuthReady();
  const pendingSync = useIsPendingPlatformSync();
  const isLoggedIn = useIsLoggedIn();
  const isGuestAuth = useIsGuestAuthScreen();
  const needsCiviaIntro = useNeedsCiviaIntro();
  const needsCompleteRegistration = useNeedsCompleteRegistration();
  const needsEidasVerification = useNeedsEidasVerification();
  const { guestAuthDestination, clearGuestAuthDestination } = useAccountContext();

  useEffect(() => {
    if (!authReady || pendingSync) {
      return;
    }

    if (isLoggedIn) {
      resetRootRoute("home");
      return;
    }

    if (needsEidasVerification) {
      resetRootRoute("auth/eidas-verification");
      return;
    }

    if (needsCompleteRegistration) {
      resetRootRoute("auth/complete-registration");
      return;
    }

    if (needsCiviaIntro) {
      resetRootRoute("auth/intro");
      return;
    }

    if (isGuestAuth && guestAuthDestination != null) {
      resetRootRoute(guestAuthDestination);
      clearGuestAuthDestination();
    }
  }, [
    authReady,
    clearGuestAuthDestination,
    guestAuthDestination,
    isGuestAuth,
    isLoggedIn,
    needsCiviaIntro,
    needsCompleteRegistration,
    needsEidasVerification,
    pendingSync,
  ]);

  return null;
}

function AuthGate({ children }: PropsWithChildren) {
  const authReady = useIsAuthReady();

  if (!authReady) {
    return (
      <View style={gateStyles.centered}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      {children}
      <AuthNavigationSync />
    </>
  );
}

function profileToRegisterInput(
  profile: RegistrationProfile,
): RegisterPlatformUserInput {
  return prepareRegistrationProfileForApi(profile);
}

export function LoggedInProvider({ children }: PropsWithChildren) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const checkInFlightRef = useRef(false);
  const registerInFlightRef = useRef(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [guestAuthDestination, setGuestAuthDestination] =
    useState<RootAuthRoute | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [platformRegistered, setPlatformRegistered] = useState(false);
  const [platformResolved, setPlatformResolved] = useState(false);
  const [eidasVerified, setEidasVerified] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const completeIntro = useCallback((destination: RootAuthRoute) => {
    setGuestAuthDestination(destination);
    setIntroCompleted(true);
  }, []);

  const clearGuestAuthDestination = useCallback(() => {
    setGuestAuthDestination(null);
  }, []);

  const resetAccountState = useCallback(() => {
    checkInFlightRef.current = false;
    registerInFlightRef.current = false;
    setIntroCompleted(false);
    setGuestAuthDestination(null);
    setPlatformUser(null);
    setPlatformRegistered(false);
    setPlatformResolved(false);
    setEidasVerified(false);
    setRegistering(false);
    setRegisterError(null);
  }, []);

  const checkPlatformAccount = useCallback(async () => {
    if (!isLoaded || !isSignedIn || checkInFlightRef.current) {
      return;
    }
    checkInFlightRef.current = true;
    setPlatformResolved(false);
    setRegisterError(null);

    const tokenGetter = async () =>
      resolveSessionToken(() => getTokenRef.current());

    try {
      const existing = await fetchPlatformMe(tokenGetter);
      if (existing) {
        setPlatformUser(existing);
        setPlatformRegistered(true);
      } else {
        setPlatformUser(null);
        setPlatformRegistered(false);
      }
    } catch (err) {
      setPlatformUser(null);
      setPlatformRegistered(false);
      setRegisterError(
        err instanceof Error ? err.message : "Could not reach the platform",
      );
    } finally {
      checkInFlightRef.current = false;
      setPlatformResolved(true);
    }
  }, [isLoaded, isSignedIn]);

  const registerWithProfile = useCallback(
    async (profile: RegistrationProfile) => {
      if (!isLoaded || !isSignedIn) {
        throw new Error("Sign in before completing registration.");
      }
      if (!isRegistrationProfileReady(profile)) {
        throw new Error("Registration profile is incomplete.");
      }
      if (registerInFlightRef.current) {
        return;
      }
      registerInFlightRef.current = true;
      setRegistering(true);
      setRegisterError(null);

      const tokenGetter = async () =>
        resolveSessionToken(() => getTokenRef.current());

      try {
        const created = await registerPlatformUser(
          tokenGetter,
          profileToRegisterInput(profile),
        );
        setPlatformUser(created);
        setPlatformRegistered(true);
      } catch (err) {
        setPlatformUser(null);
        setPlatformRegistered(false);
        const message =
          err instanceof Error ? err.message : "Platform registration failed";
        setRegisterError(message);
        throw err;
      } finally {
        registerInFlightRef.current = false;
        setRegistering(false);
      }
    },
    [isLoaded, isSignedIn],
  );

  const completeEidasVerification = useCallback(() => {
    if (!platformRegistered) {
      throw new Error("Register on the platform before completing eIDAS verification.");
    }
    setEidasVerified(true);
  }, [platformRegistered]);

  useEffect(() => {
    if (!isLoaded) {
      setPlatformResolved(false);
      return;
    }

    if (!isSignedIn) {
      resetAccountState();
      setPlatformResolved(true);
      return;
    }

    void checkPlatformAccount();
  }, [isLoaded, isSignedIn, resetAccountState, checkPlatformAccount]);

  const value = useMemo(
    () => ({
      introCompleted,
      guestAuthDestination,
      platformUser,
      platformRegistered,
      platformResolved,
      eidasVerified,
      registering,
      registerError,
      completeIntro,
      clearGuestAuthDestination,
      registerWithProfile,
      completeEidasVerification,
      resetAccountState,
    }),
    [
      introCompleted,
      guestAuthDestination,
      platformUser,
      platformRegistered,
      platformResolved,
      eidasVerified,
      registering,
      registerError,
      completeIntro,
      clearGuestAuthDestination,
      registerWithProfile,
      completeEidasVerification,
      resetAccountState,
    ],
  );

  return (
    <AccountCtx.Provider value={value}>
      <AuthGate>{children}</AuthGate>
    </AccountCtx.Provider>
  );
}

const gateStyles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
