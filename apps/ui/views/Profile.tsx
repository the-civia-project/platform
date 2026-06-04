import { useUser } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Settings } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { IconButton } from "../components/Button";
import { useTheme } from "../components/use-theme";
import UserProfile from "../components/UserProfile";
import { useUserProfileFeed } from "../core/demo/user-profile-feed";
import { usePlatformUser } from "../core/account/hooks";
import {
  platformUserToProfileHeader,
  platformUserToProfileProps,
} from "../core/account/platform-user-profile";
import type { PlatformUser } from "../core/account/platform-api";

type ProfileContentProps = {
  platformUser: PlatformUser;
  clerkImageUrl?: string | null;
  clerkUserId?: string | null;
};

function ProfileContent({
  platformUser,
  clerkImageUrl,
  clerkUserId,
}: ProfileContentProps) {
  const navigation = useNavigation<{
    navigate: (route: "home" | "settings") => void;
  }>();

  const header = useMemo(
    () =>
      platformUserToProfileHeader(platformUser, clerkImageUrl, clerkUserId),
    [platformUser, clerkImageUrl, clerkUserId],
  );

  const author = useMemo(
    () =>
      platformUserToProfileProps(platformUser, clerkImageUrl, clerkUserId),
    [platformUser, clerkImageUrl, clerkUserId],
  );

  const { tabs } = useUserProfileFeed({
    author,
    idPrefix: platformUser.user_id,
  });

  const actions = useMemo(
    () => (
      <View style={styles.actions}>
        <IconButton
          icon={ChevronLeft}
          size="md"
          accessibilityLabel="Back to home"
          onPress={() => navigation.navigate("home")}
        />
        <IconButton
          icon={Settings}
          size="md"
          accessibilityLabel="Settings"
          onPress={() => navigation.navigate("settings")}
        />
      </View>
    ),
    [navigation],
  );

  const onTabChange = useCallback((id: string) => {
    console.log("[profile] tab", id);
  }, []);

  return (
    <UserProfile
      avatar={header.avatar}
      {...(header.name ? { name: header.name } : {})}
      handle={header.handle}
      flag={header.flag}
      location={header.location}
      actions={actions}
      tabs={tabs}
      onTabChange={onTabChange}
    />
  );
}

export default function Profile() {
  const theme = useTheme();
  const platformUser = usePlatformUser();
  const { user } = useUser();

  if (!platformUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.fgMuted} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ProfileContent
        platformUser={platformUser}
        clerkImageUrl={user?.imageUrl}
        clerkUserId={user?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
