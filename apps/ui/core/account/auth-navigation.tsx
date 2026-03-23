import {
  CommonActions,
  createNavigationContainerRef,
} from "@react-navigation/native";

export type RootAuthRoute =
  | "home"
  | "auth/intro"
  | "auth/sign-in"
  | "auth/sign-up"
  | "auth/complete-registration"
  | "auth/profile-onboarding";

export const rootNavigationRef = createNavigationContainerRef();

export function resetRootRoute(name: RootAuthRoute) {
  if (!rootNavigationRef.isReady()) {
    return;
  }

  rootNavigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name }],
    }),
  );
}
