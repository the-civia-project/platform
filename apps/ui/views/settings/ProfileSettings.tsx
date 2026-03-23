import { PlaceholderPage } from "../../core/placeholder/PlaceholderPage";

export default function ProfileSettings() {
  return (
    <PlaceholderPage
      lede="Edit display name, bio, and avatar shown on your profile."
      sections={[
        {
          title: "Planned",
          body: "Account fields synced with your identity provider and the public profile screen.",
        },
      ]}
    />
  );
}
