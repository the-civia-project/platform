import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutGrid } from "lucide-react-native";
import { IconButton } from "../components/Button";
import { useTheme } from "../components/use-theme";
import { rootNavigationRef } from "./account/auth-navigation";
import { useIsUiKitRouteAvailable } from "./account/hooks";

function useRootRouteName() {
  const [routeName, setRouteName] = useState<string | undefined>();

  useEffect(() => {
    const sync = () => {
      if (rootNavigationRef.isReady()) {
        setRouteName(rootNavigationRef.getCurrentRoute()?.name);
      }
    };

    sync();
    const unsubscribe = rootNavigationRef.addListener("state", sync);
    return unsubscribe;
  }, []);

  return routeName;
}

export function UiKitQuickAccess() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const uiKitAvailable = useIsUiKitRouteAvailable();
  const routeName = useRootRouteName();

  if (!uiKitAvailable || routeName === "ui-kit") {
    return null;
  }

  const openUiKit = () => {
    if (!rootNavigationRef.isReady()) {
      return;
    }
    rootNavigationRef.navigate("ui-kit" as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: insets.bottom + 16,
          right: Math.max(insets.right, 16),
        },
      ]}
    >
      <View
        style={[
          styles.chip,
          Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            },
            android: { elevation: 6 },
            default: {},
          }),
          {
            backgroundColor: theme.surfaceCard,
            borderColor: theme.borderDefault,
          },
        ]}
      >
        <IconButton
          icon={LayoutGrid}
          size="md"
          variant="full-ghost"
          accessibilityLabel="Open UI Kit"
          onPress={openUiKit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    zIndex: 50,
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
