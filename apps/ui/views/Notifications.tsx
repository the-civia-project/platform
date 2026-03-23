import { PlaceholderPage } from "../core/placeholder/PlaceholderPage";

export default function Notifications() {
  return (
    <PlaceholderPage
      lede="Alerts for mentions, replies, and follows. Delivery preferences live under Settings."
      sections={[
        {
          title: "Planned",
          body: "Activity list grouped by day, read state, and filters for mentions and follows.",
        },
      ]}
    />
  );
}
