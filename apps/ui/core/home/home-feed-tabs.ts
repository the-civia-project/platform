export type HomeFeedTabId = "for-you" | "following" | "missing-out";

export type HomeFeedTab = {
  id: HomeFeedTabId;
  label: string;
};

export const HOME_FEED_TABS: HomeFeedTab[] = [
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "missing-out", label: "Missing out" },
];
