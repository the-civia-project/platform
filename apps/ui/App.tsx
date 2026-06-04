import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  createStaticNavigation,
  DarkTheme,
  DefaultTheme,
  Theme,
  type StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ThemePatternBackground from "./components/ThemePatternBackground";
import {
  ThemeFlavorProvider,
  useResolvedColorScheme,
  useTheme,
} from "./components/use-theme";
import { rootNavigationRef } from "./core/account/auth-navigation";
import { getPlatformApiUrl } from "./core/account/platform-api";
import CompleteRegistration from "./core/account/CompleteRegistration";
import { LoggedInProvider } from "./core/account/LoggedIn";
import {
  useIsGuestAuthScreen,
  useIsLoggedIn,
  useIsPlatformMember,
  useIsUiKitRouteAvailable,
  useNeedsCiviaIntro,
  useNeedsCompleteRegistration,
} from "./core/account/hooks";
import CiviaIntroScreen from "./core/account/intro/CiviaIntroScreen";
import { UiKitQuickAccess } from "./core/UiKitQuickAccess";
import SignIn from "./core/account/SignIn";
import SignUp from "./core/account/SignUp";
import DataCollection from "./core/data-collection/DataCollection";
import { FontsProvider } from "./core/fonts";
import { GlobalLoadingProvider } from "./core/global-loader";
import Bookmarks from "./views/Bookmarks";
import Compose from "./views/Compose";
import Explore from "./views/Explore";
import Home from "./views/Home";
import Lists from "./views/Lists";
import Notifications from "./views/Notifications";
import Profile from "./views/Profile";
import NotificationSettings from "./views/settings/NotificationSettings";
import PrivacySettings from "./views/settings/PrivacySettings";
import ProfileSettings from "./views/settings/ProfileSettings";
import ThemeSettings from "./views/settings/ThemeSettings";
import Settings from "./views/Settings";
import UiKit from "./views/ui-kit/UiKit";

const publishableKey =
  Constants.expoConfig?.extra?.clerkPublishableKey as string | undefined;

if (!publishableKey) {
  throw new Error(
    "Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) in the root .env",
  );
}

const RootStack = createNativeStackNavigator({
  screenOptions: {
    animation: "fade",
    /** Let {@link ThemePatternBackground} show through; cards are otherwise opaque. */
    contentStyle: { backgroundColor: "transparent" },
  },
  screens: {
    home: {
      if: useIsLoggedIn,
      screen: Home,
      linking: {
        path: "",
      },
      options: {
        title: "The Civia Platform",
        header: () => null,
      },
    },
    compose: {
      if: useIsLoggedIn,
      screen: Compose,
      linking: {
        path: "compose",
      },
      options: {
        title: "New post",
        presentation: "modal",
      },
    },
    settings: {
      if: useIsLoggedIn,
      screen: Settings,
      linking: {
        path: "settings",
      },
      options: {
        title: "Settings",
      },
    },
    explore: {
      if: useIsLoggedIn,
      screen: Explore,
      linking: {
        path: "explore",
      },
      options: {
        title: "Explore",
      },
    },
    notifications: {
      if: useIsLoggedIn,
      screen: Notifications,
      linking: {
        path: "notifications",
      },
      options: {
        title: "Notifications",
      },
    },
    bookmarks: {
      if: useIsLoggedIn,
      screen: Bookmarks,
      linking: {
        path: "bookmarks",
      },
      options: {
        title: "Bookmarks",
      },
    },
    lists: {
      if: useIsLoggedIn,
      screen: Lists,
      linking: {
        path: "lists",
      },
      options: {
        title: "Lists",
      },
    },
    profile: {
      if: useIsLoggedIn,
      screen: Profile,
      linking: {
        path: "profile",
      },
      options: {
        title: "Profile",
        header: () => null,
      },
    },
    "settings/profile": {
      if: useIsPlatformMember,
      screen: ProfileSettings,
      linking: {
        path: "settings/profile",
      },
      options: {
        title: "Profile settings",
      },
    },
    "settings/notifications": {
      if: useIsLoggedIn,
      screen: NotificationSettings,
      linking: {
        path: "settings/notifications",
      },
      options: {
        title: "Notification settings",
      },
    },
    "settings/theme": {
      if: useIsLoggedIn,
      screen: ThemeSettings,
      linking: {
        path: "settings/theme",
      },
      options: {
        title: "Theme",
      },
    },
    "settings/privacy": {
      if: useIsLoggedIn,
      screen: PrivacySettings,
      linking: {
        path: "settings/privacy",
      },
      options: {
        title: "Privacy",
      },
    },
    "auth/intro": {
      if: useNeedsCiviaIntro,
      screen: CiviaIntroScreen,
      linking: {
        path: "auth/intro",
      },
      options: {
        title: "Civia Introduction",
        header: () => null,
      },
    },
    "auth/sign-in": {
      if: useIsGuestAuthScreen,
      screen: SignIn,
      linking: {
        path: "auth/sign-in",
      },
      options: {
        title: "Sign in",
        header: () => null,
      },
    },
    "auth/sign-up": {
      if: useIsGuestAuthScreen,
      screen: SignUp,
      linking: {
        path: "auth/sign-up",
      },
      options: {
        title: "Sign up",
        header: () => null,
      },
    },
    "auth/complete-registration": {
      if: useNeedsCompleteRegistration,
      screen: CompleteRegistration,
      linking: {
        path: "auth/complete-registration",
      },
      options: {
        title: "Complete registration",
        header: () => null,
      },
    },
    "ui-kit": {
      if: useIsUiKitRouteAvailable,
      screen: UiKit,
      linking: {
        path: "ui-kit",
      },
      options: {
        title: "UI Kit",
        header: () => null,
      },
    },
  },
});

declare global {
  namespace ReactNavigation {
    interface RootParamList extends StaticParamList<typeof RootStack> { }
  }
}

const Navigation = createStaticNavigation(RootStack);

const linking = {
  prefixes: [Linking.createURL("/")],
};

/**
 * Inner shell that reads {@link useTheme} for safe-area fill behind the navigator,
 * repeats the flavour pattern under transparent navigation cards, and hosts the root
 * {@link Navigation} tree.
 */
function AppChrome() {
  const theme = useTheme();
  const scheme = useResolvedColorScheme();

  useEffect(() => {
    void fetch(`${getPlatformApiUrl()}/health`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        console.log("[platform-api] GET /health", res.ok ? json : { status: res.status, json });
      })
      .catch((err) => {
        console.log("[platform-api] GET /health", err);
      });
  }, []);

  const navTheme = useMemo((): Theme => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: "transparent",
        card: "transparent",
      },
    };
  }, [scheme]);

  return (
    <View
      style={[
        styles.appRoot,
        Platform.OS === "web" && styles.appRootWeb,
        Platform.OS === "web" && { backgroundColor: theme.surfaceCard },
      ]}
    >
      <ThemePatternBackground />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.surfaceCard },
          Platform.OS === "web" && styles.containerWeb,
          Platform.OS === "web" && styles.containerWebTransparent,
        ]}
      >
        <LoggedInProvider>
          <StatusBar style={scheme === "dark" ? "dark" : "light"} />
          <View style={styles.chromeInner}>
            <View style={styles.chromeForeground}>
              <Navigation
                ref={rootNavigationRef}
                theme={navTheme}
                linking={linking}
              />
              <UiKitQuickAccess />
            </View>
          </View>
        </LoggedInProvider>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ThemeFlavorProvider>
          <GlobalLoadingProvider>
            <DataCollection>
              <FontsProvider>
                <AppChrome />
              </FontsProvider>
            </DataCollection>
          </GlobalLoadingProvider>
        </ThemeFlavorProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  appRootWeb: {
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  containerWeb: {
    width: "100%",
    maxWidth: 976,
  },
  containerWebTransparent: {
    backgroundColor: "transparent",
  },
  chromeInner: {
    flex: 1,
    minHeight: 0,
  },
  chromeForeground: {
    flex: 1,
    minHeight: 0,
  },
});
