import dotenv from "dotenv";
import type { ExpoConfig } from "expo/config";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const DEFAULT_PLATFORM_API_URL = "http://platform.localhost:3001";

const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const platformApiUrl =
  process.env.PLATFORM_API_URL?.replace(/\/$/, "") ?? DEFAULT_PLATFORM_API_URL;

const config: ExpoConfig = {
  name: "The Civia Platform",
  slug: "ui",
  scheme: "civia-platform",
  version: "0.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.civia.platform.ui",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.civia.platform.ui",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "platform.theciviaproject.org",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-font",
      {
        fonts: ["./assets/fonts/gabriela/gabriela-latin-400-normal.ttf"],
        android: {
          fonts: [
            {
              fontFamily: "Inter",
              fontDefinitions: [
                {
                  path: "./assets/fonts/gabriela/gabriela-latin-400-normal.ttf",
                  weight: 400,
                },
              ],
            },
          ],
        },
        ios: {
          fonts: ["./assets/fonts/gabriela/gabriela-latin-400-normal.ttf"],
        },
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow $(PRODUCT_NAME) to attach photos to your posts.",
        cameraPermission: "Allow $(PRODUCT_NAME) to take photos for your posts.",
      },
    ],
    "expo-image",
    "expo-asset",
    "expo-background-task",
    "expo-build-properties",
    "expo-localization",
    "expo-secure-store",
    "@clerk/expo",
    "expo-sharing",
    "expo-sqlite",
    "expo-web-browser",
  ],
  extra: {
    clerkPublishableKey,
    platformApiUrl,
  },
};

export default config;
