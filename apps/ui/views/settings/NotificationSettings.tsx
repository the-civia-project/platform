import { PlaceholderPage } from "../../core/placeholder/PlaceholderPage";

export default function NotificationSettings() {
  return (
    <PlaceholderPage
      lede="Choose which events notify you and how."
      sections={[
        {
          title: "Planned",
          body: "Push, email, and in-app toggles per notification category.",
        },
      ]}
    />
  );
}
