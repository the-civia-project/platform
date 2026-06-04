/**
 * UI Kit screen for {@link UserProfile}, the profile-page composition:
 * an X-style header (full-bleed banner, overlapping avatar with ring,
 * action overlay, identity stack, bio, meta row, stats row) followed
 * by a generic tab strip above a {@link "../../components/Feed".Feed}
 * body that swaps data on tab change.
 *
 * Like {@link "./FeedScreen".default}, this screen deliberately does
 * **not** wrap in {@link "../../components/Page".Page}: the
 * {@link UserProfile} is a vertical scroll container (it owns a Feed
 * inside), and nesting two vertical scrollers re-introduces the
 * gesture-conflict problem documented on `Feed.tsx`. The component is
 * mounted as the screen's only top-level child.
 *
 * Tab feeds come from {@link "../../core/demo/user-profile-feed".useUserProfileFeed}.
 */
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Calendar,
  Link as LinkIcon,
  Mail,
  MoreVertical,
} from "lucide-react-native";
import Button, { IconButton } from "../../components/Button";
import type { ProfileProps } from "../../components/Profile";
import { Description } from "../../components/Typography";
import UserProfile, {
  type UserProfileMeta,
  type UserProfileStat,
} from "../../components/UserProfile";
import { useUserProfileFeed } from "../../core/demo/user-profile-feed";
import { randomAvatar } from "../../core/demo/random-avatar";

const SUBJECT = {
  avatar: randomAvatar("Aria"),
  name: "Aria Popescu",
  handle: "aria",
  flag: "RO",
  location: "Berlin, Germany",
} as const;

const BANNER_URL = "https://picsum.photos/seed/aria-banner/1200/400";

const BIO_TEXT =
  "Editorial pipelines, civic design, slower-paced internet. Walking the Carpathians whenever the desk lets me; otherwise reading notes and shipping the colour-tokens package.";

function subjectAsProfile(): ProfileProps {
  return {
    source: SUBJECT.avatar,
    name: SUBJECT.name,
    flag: SUBJECT.flag,
    from: SUBJECT.location,
  };
}

export default function UserProfileScreen() {
  const author = useMemo(() => subjectAsProfile(), []);
  const { tabs } = useUserProfileFeed({
    author,
    idPrefix: "aria-demo",
  });

  const onTabChange = useCallback((id: string) => {
    console.log(`[UserProfile demo] active tab -> ${id}`);
  }, []);

  const meta = useMemo<UserProfileMeta[]>(
    () => [
      { icon: Calendar, label: "Joined March 2018" },
      { icon: LinkIcon, label: "aria.example/notes" },
      { icon: LinkIcon, label: "aria.example/colors" },
      { icon: LinkIcon, label: "github.com/aria-popescu" },
    ],
    [],
  );

  const stats = useMemo<UserProfileStat[]>(
    () => [
      { label: "Posts", value: 482 },
      {
        label: "Followers",
        value: 12_400,
        onPress: () =>
          console.log("[UserProfile demo] open followers list"),
      },
      {
        label: "Following",
        value: 312,
        onPress: () =>
          console.log("[UserProfile demo] open following list"),
      },
    ],
    [],
  );

  const actions = useMemo(
    () => (
      <View style={styles.actionsRow}>
        <Button
          variant="inverted"
          onPress={() => console.log("[UserProfile demo] follow tapped")}
        >
          Follow
        </Button>
        <IconButton
          icon={Mail}
          accessibilityLabel="Message"
          variant="inverted"
          shape="round"
          onPress={() => console.log("[UserProfile demo] message tapped")}
        />
        <IconButton
          icon={MoreVertical}
          accessibilityLabel="More options"
          variant="inverted"
          shape="round"
          onPress={() => console.log("[UserProfile demo] menu tapped")}
        />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.screen}>
      <UserProfile
        avatar={SUBJECT.avatar}
        name={SUBJECT.name}
        handle={SUBJECT.handle}
        flag={SUBJECT.flag}
        location={SUBJECT.location}
        banner={{ source: BANNER_URL }}
        bio={<Description>{BIO_TEXT}</Description>}
        meta={meta}
        stats={stats}
        actions={actions}
        tabs={tabs}
        onTabChange={onTabChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
