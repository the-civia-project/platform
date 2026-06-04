import { useNavigation } from "@react-navigation/native";
import { Bell, Palette, Shield, Trash2, User } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../components/Button";
import { Drawer, DrawerItem } from "../components/Drawer";
import { Page } from "../components/Page";
import { Section } from "../components/Section";
import { Description, Lede, Text } from "../components/Typography";
import { useTheme } from "../components/use-theme";
import { useDeleteAccount, useLogout } from "../core/account/hooks";

export default function Settings() {
  const theme = useTheme();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigation = useNavigation<{
    navigate: (
      route:
        | "settings/profile"
        | "settings/notifications"
        | "settings/theme"
        | "settings/privacy",
    ) => void;
  }>();

  const closeDeleteDrawer = useCallback(() => {
    if (deleting) {
      return;
    }
    setDeleteOpen(false);
    setDeleteError(null);
  }, [deleting]);

  const confirmDeleteAccount = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete your account",
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteAccount]);

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

      <Section title="Danger zone">
        <View style={styles.group}>
          <DrawerItem
            icon={Trash2}
            label="Delete account"
            description="Permanently remove your platform and sign-in account"
            destructive
            onPress={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        </View>
      </Section>

      <Drawer
        open={deleteOpen}
        onClose={closeDeleteDrawer}
        title="Delete your account?"
        subtitle="This action cannot be undone."
        hideCloseButton
        footer={
          <>
            <View style={styles.footerColumn}>
              <Button
                variant="full-ghost"
                disabled={deleting}
                onPress={closeDeleteDrawer}
              >
                Cancel
              </Button>
            </View>
            <View style={styles.footerColumn}>
              <Button
                variant="danger"
                disabled={deleting}
                onPress={() => {
                  void confirmDeleteAccount();
                }}
              >
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            </View>
          </>
        }
      >
        <Text style={styles.paragraph}>
          Your profile, posts, and platform data will be removed. Your Clerk
          sign-in account will also be deleted, so you will need to create a
          new account to use The Civia Platform again.
        </Text>
        {deleteError ? (
          <Text style={[styles.error, { color: theme.danger }]}>
            {deleteError}
          </Text>
        ) : null}
      </Drawer>
    </Page>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 2,
  },
  footerColumn: {
    flex: 1,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
});
