import { useUser } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import { Settings } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Avatar from "../../components/Avatar";
import { IconButton } from "../../components/Button";
import Logo from "../../components/Logo";
import { Text } from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import { ThemeFlavorSwitcher } from "../theme/ThemeFlavorSwitcher";
import { usePlatformUser } from "../account/hooks";
import { resolveUserAvatarSource } from "./resolve-user-avatar";
import { webFocusOutlineStyle } from "../web-focus-outline";

export function HomeHeader() {
  const theme = useTheme();
  const navigation = useNavigation<{
    navigate: (route: "profile" | "settings") => void;
  }>();
  const { user } = useUser();
  const platformUser = usePlatformUser();
  const avatarSource = resolveUserAvatarSource(
    platformUser,
    user?.imageUrl,
    user?.id,
  );

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.borderDefault,
          backgroundColor: theme.surfaceCard,
        },
      ]}
    >
      <View style={styles.brand}>
        <Logo size="xs" />
        <Text style={styles.title}>The Civia Platform</Text>
      </View>
      <View style={styles.actions}>
        <ThemeFlavorSwitcher />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => navigation.navigate("profile")}
          style={({ pressed }) => [
            styles.avatarPressable,
            webFocusOutlineStyle(),
            pressed && styles.avatarPressed,
          ]}
        >
          <Avatar
            source={avatarSource}
            size="sm"
            shape="round"
            accessibilityLabel="Your profile"
          />
        </Pressable>
        <IconButton
          icon={Settings}
          size="sm"
          accessibilityLabel="Settings"
          onPress={() => navigation.navigate("settings")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    justifyContent: "flex-end",
  },
  avatarPressable: {
    borderRadius: 999,
  },
  avatarPressed: {
    opacity: 0.85,
  },
});
