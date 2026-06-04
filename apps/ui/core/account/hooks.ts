import { useAuth } from "@clerk/expo";
import { useMemo } from "react";
import { useAccountContext } from "./account-context";
import { deletePlatformAccount } from "./platform-api";

export function useAccountActions() {
  const { completeIntro, registerWithProfile, resetAccountState } =
    useAccountContext();
  return {
    completeIntro,
    registerWithProfile,
    resetAccountState,
  };
}

export function usePlatformRegistrationState() {
  const { registering, registerError } = useAccountContext();
  return { registering, registerError };
}

export function usePlatformUser() {
  const { platformUser } = useAccountContext();
  return platformUser;
}

export function useIsLoggedIn() {
  const { isSignedIn, isLoaded } = useAuth();
  const { platformRegistered } = useAccountContext();
  return isLoaded && !!isSignedIn && platformRegistered;
}

/** Signed in with a platform account. */
export function useIsPlatformMember() {
  const { isSignedIn, isLoaded } = useAuth();
  const { platformRegistered, platformResolved } = useAccountContext();
  return isLoaded && !!isSignedIn && platformResolved && platformRegistered;
}

export function useIsGuest() {
  const { isSignedIn, isLoaded } = useAuth();
  return isLoaded && !isSignedIn;
}

/** Guest who has finished the Civia intro this session — may use sign-in / sign-up. */
export function useIsGuestAuthScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { introCompleted } = useAccountContext();
  return isLoaded && !isSignedIn && introCompleted;
}

/** Logged-out user who has not completed the intro this session. */
export function useNeedsCiviaIntro() {
  const { isSignedIn, isLoaded } = useAuth();
  const { introCompleted } = useAccountContext();
  return isLoaded && !isSignedIn && !introCompleted;
}

export function useNeedsCompleteRegistration() {
  const { isSignedIn, isLoaded } = useAuth();
  const { platformRegistered, platformResolved, registering } =
    useAccountContext();
  return (
    isLoaded &&
    !!isSignedIn &&
    platformResolved &&
    !platformRegistered &&
    !registering
  );
}

/** True while POST /register is in flight (form stays visible; button shows progress). */
export function useIsPendingPlatformSync() {
  const { registering } = useAccountContext();
  return registering;
}

/** Clerk has loaded — UI Kit is available (including on auth screens). */
export function useIsUiKitRouteAvailable() {
  const { isLoaded } = useAuth();
  return isLoaded;
}

/** Clerk has loaded and, when signed in, the initial platform `/me` check has finished. */
export function useIsAuthReady() {
  const { isLoaded, isSignedIn } = useAuth();
  const { platformResolved } = useAccountContext();
  return isLoaded && (!isSignedIn || platformResolved);
}

export function useLogout() {
  const { signOut, sessionId, isSignedIn } = useAuth();
  const { resetAccountState } = useAccountActions();

  return useMemo(
    () => async () => {
      resetAccountState();
      if (!isSignedIn) {
        return;
      }
      await signOut(sessionId ? { sessionId } : undefined);
    },
    [isSignedIn, resetAccountState, sessionId, signOut],
  );
}

export function useDeleteAccount() {
  const { getToken, signOut, sessionId, isSignedIn } = useAuth();
  const { resetAccountState } = useAccountActions();

  return useMemo(
    () => async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No Clerk session token");
      }

      await deletePlatformAccount(async () => token);
      resetAccountState();

      if (isSignedIn) {
        await signOut(sessionId ? { sessionId } : undefined);
      }
    },
    [getToken, isSignedIn, resetAccountState, sessionId, signOut],
  );
}
