import { View } from "react-native";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";
import { Description } from "../../../components/Typography";
import { avatarFromHandle } from "../avatar-from-handle";
import { SUGGESTED_ACCOUNTS } from "./profile-onboarding-data";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

export type ProfileOnboardingFollowsStepProps = {
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
};

export function ProfileOnboardingFollowsStep({
  draft,
  onChange,
}: ProfileOnboardingFollowsStepProps) {
  const toggleFollow = (accountId: string) => {
    const followed = new Set(draft.followedAccountIds);
    if (followed.has(accountId)) {
      followed.delete(accountId);
    } else {
      followed.add(accountId);
    }
    onChange({ ...draft, followedAccountIds: [...followed] });
  };

  return (
    <View style={{ gap: 16 }}>
      {SUGGESTED_ACCOUNTS.map((account) => {
        const following = draft.followedAccountIds.includes(account.id);
        return (
          <View
            key={account.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Avatar
              source={avatarFromHandle(account.handle)}
              size="md"
              shape="round"
              accessibilityLabel={`${account.displayName} avatar`}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Description>{account.displayName}</Description>
              <Description>{account.handle}</Description>
              <Description>{account.bio}</Description>
            </View>
            <Button
              variant={following ? "ghost" : "primary"}
              onPress={() => toggleFollow(account.id)}
            >
              {following ? "Following" : "Follow"}
            </Button>
          </View>
        );
      })}
    </View>
  );
}
