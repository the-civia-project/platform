/**
 * Barrel for the Feed family. {@link Feed} is the infinite-scrolling stream
 * of {@link "../Post".default}s built on `@shopify/flash-list`; the user
 * must never reach the end (see the file header in `./Feed.tsx` for the
 * UX invariant and how it's enforced).
 */
export {
  Feed,
  type FeedHandle,
  type FeedItem,
  type FeedProps,
} from "./Feed";
