import { useNavigation } from "@react-navigation/native";
import { Bell, Home, Search, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button, { IconButton } from "../../components/Button";
import { useTheme } from "../../components/use-theme";

export function HomeFooter() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<{
    navigate: (
      route: "home" | "explore" | "notifications" | "compose" | "profile",
    ) => void;
  }>();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopColor: theme.borderDefault,
          backgroundColor: theme.surfaceCard,
        },
      ]}
    >
      <IconButton
        icon={Home}
        size="md"
        accessibilityLabel="Home"
        onPress={() => navigation.navigate("home")}
      />
      <IconButton
        icon={Search}
        size="md"
        accessibilityLabel="Search"
        onPress={() => navigation.navigate("explore")}
      />
      <Button onPress={() => navigation.navigate("compose")}>Post</Button>
      <IconButton
        icon={Bell}
        size="md"
        accessibilityLabel="Notifications"
        onPress={() => navigation.navigate("notifications")}
      />
      <IconButton
        icon={User}
        size="md"
        accessibilityLabel="Profile"
        onPress={() => navigation.navigate("profile")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flexShrink: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
});
