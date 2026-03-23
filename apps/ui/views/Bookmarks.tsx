import { PlaceholderPage } from "../core/placeholder/PlaceholderPage";

export default function Bookmarks() {
  return (
    <PlaceholderPage
      lede="Posts you save for later. Saving from the feed is not wired yet."
      sections={[
        {
          title: "Planned",
          body: "Bookmarked posts in reverse chronological order with search and folders.",
        },
      ]}
    />
  );
}
