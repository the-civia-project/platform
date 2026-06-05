import { createContext, useContext } from "react";
import type { RootAuthRoute } from "./auth-navigation";
import type { PlatformUser } from "./platform-api";
import type { RegistrationProfile } from "./registration-profile";

export type AccountContextValue = {
  introCompleted: boolean;
  platformUser: PlatformUser | null;
  platformRegistered: boolean;
  platformResolved: boolean;
  eidasVerified: boolean;
  registering: boolean;
  registerError: string | null;
  /**
   * Set when intro finishes; {@link LoggedIn} auth sync resets the stack here.
   */
  guestAuthDestination: RootAuthRoute | null;
  completeIntro: (destination: RootAuthRoute) => void;
  clearGuestAuthDestination: () => void;
  registerWithProfile: (profile: RegistrationProfile) => Promise<void>;
  completeEidasVerification: () => void;
  resetAccountState: () => void;
};

export const AccountCtx = createContext<AccountContextValue | null>(null);

export function useAccountContext() {
  const ctx = useContext(AccountCtx);
  if (!ctx) {
    throw new Error("Account hooks must be used within LoggedInProvider");
  }
  return ctx;
}
