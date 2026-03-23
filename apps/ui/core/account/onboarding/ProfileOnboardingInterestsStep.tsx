import { Globe2, Landmark, Scale, Vote, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { SelectableChecklist } from "../../../components/SelectableChecklist";
import { SelectablePillGroup } from "../../../components/SelectablePillGroup";
import { SelectableTopicList } from "../../../components/SelectableTopicList";
import {
  ONBOARDING_INTEREST_GROUPS,
  type OnboardingInterestGroup,
} from "./profile-onboarding-data";
import type { ProfileOnboardingDraft } from "./profile-onboarding-draft";

const CHECK_ROW_ICONS: Record<string, LucideIcon> = {
  "local-government": Landmark,
  elections: Vote,
  "eu-affairs": Globe2,
  "public-services": Scale,
};

export type ProfileOnboardingInterestsStepProps = {
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
};

function InterestGroup({
  group,
  draft,
  onChange,
}: {
  group: OnboardingInterestGroup;
  draft: ProfileOnboardingDraft;
  onChange: (draft: ProfileOnboardingDraft) => void;
}) {
  const setInterestIds = (interestIds: readonly string[]) => {
    onChange({ ...draft, interestIds });
  };

  switch (group.presentation) {
    case "pills":
      return (
        <SelectablePillGroup
          eyebrow={group.eyebrow}
          blurb={group.blurb}
          options={group.items.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          value={draft.interestIds}
          onChange={setInterestIds}
        />
      );
    case "check-rows":
      return (
        <SelectableChecklist
          eyebrow={group.eyebrow}
          blurb={group.blurb}
          items={group.items.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description,
            icon: CHECK_ROW_ICONS[item.id],
          }))}
          value={draft.interestIds}
          onChange={setInterestIds}
        />
      );
    case "topic-cards":
      return (
        <SelectableTopicList
          eyebrow={group.eyebrow}
          blurb={group.blurb}
          items={group.items.map((item) => ({
            id: item.id,
            title: item.label,
            description: item.description ?? "",
            initial: item.initial,
          }))}
          value={draft.interestIds}
          onChange={setInterestIds}
        />
      );
    default: {
      const _exhaustive: never = group.presentation;
      return _exhaustive;
    }
  }
}

export function ProfileOnboardingInterestsStep({
  draft,
  onChange,
}: ProfileOnboardingInterestsStepProps) {
  return (
    <View style={{ gap: 20 }}>
      {ONBOARDING_INTEREST_GROUPS.map((group) => (
        <InterestGroup
          key={group.id}
          group={group}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </View>
  );
}
