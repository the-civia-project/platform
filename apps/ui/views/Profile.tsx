import { PlaceholderPage } from "../core/placeholder/PlaceholderPage";

export default function Profile() {
  return (
    <PlaceholderPage
      lede="Your public profile, posts, and media. Uses demo data until the API is connected."
      sections={[
        {
          title: "Planned",
          body: "Profile header, tabbed feed, and media grid — see the User profile screen in the UI Kit for the target layout.",
        },
      ]}
    />
  );
}
