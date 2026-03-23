import { useNavigation } from "@react-navigation/native";
import { Bell, Palette, Shield, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { DrawerItem } from "../components/Drawer";
import { Page } from "../components/Page";
import { Section } from "../components/Section";
import { Description, Lede } from "../components/Typography";
import { useLogout } from "../core/account/hooks";

export default function Settings() {
  const logout = useLogout();
  const navigation = useNavigation<{
    navigate: (
      route:
        | "settings/profile"
        | "settings/notifications"
        | "settings/theme"
        | "settings/privacy",
    ) => void;
  }>();

  return (
    <Page>
      <Lede>Account preferences and app options. Several sections are placeholders until those flows ship.</Lede>

      <Section title="Account">
        <View style={styles.group}>
          <DrawerItem
            icon={User}
            label="Profile"
            description="Edit your public profile"
            onPress={() => navigation.navigate("settings/profile")}
          />
          <DrawerItem
            icon={Bell}
            label="Notifications"
            description="Choose what you are notified about"
            onPress={() => navigation.navigate("settings/notifications")}
          />
        </View>
      </Section>

      <Section title="Appearance">
        <View style={styles.group}>
          <DrawerItem
            icon={Palette}
            label="Theme"
            description="Colour flavour for the app"
            onPress={() => navigation.navigate("settings/theme")}
          />
        </View>
      </Section>

      <Section title="Privacy">
        <View style={styles.group}>
          <DrawerItem
            icon={Shield}
            label="Privacy and safety"
            description="Blocking, muting, and data"
            onPress={() => navigation.navigate("settings/privacy")}
          />
        </View>
      </Section>

      <Section title="About">
        <Description>The Civia Platform client.</Description>
      </Section>

      <Section title="Session">
        <View style={styles.group}>
          <DrawerItem
            label="Sign out"
            destructive
            onPress={() => {
              void logout();
            }}
          />
        </View>
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 2,
  },
});
