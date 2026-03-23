/**
 * Barrel for the UserProfile family. {@link UserProfile} is the kit's
 * profile-page composition: an X-style header (full-bleed banner,
 * overlapping {@link "../Avatar".default}, action overlay, identity
 * stack, bio, meta, stats) over a generic tab strip, with a
 * {@link "../Feed".Feed} body rendering the active tab's stream. See
 * the file header in `./UserProfile.tsx` for the four structural
 * rules (Feed-as-scroll-container, parent-owns-paging, tab-change
 * snaps to top, controlled-or-uncontrolled active tab).
 */
export {
  default,
  type UserProfileBanner,
  type UserProfileFeed,
  type UserProfileFeedTabConfig,
  type UserProfileMediaTabConfig,
  type UserProfileMeta,
  type UserProfileProps,
  type UserProfileStat,
  type UserProfileTabConfig,
} from "./UserProfile";
export { chunkMediaImages } from "./chunk-media-images";
export {
  MEDIA_GRID_COLUMNS,
  mediaGridThumbnailPixelSize,
  mediaGridTileLogicalSize,
  resolveMediaThumbnailUri,
  type ResolveMediaThumbnailSource,
} from "./resolve-media-thumbnail";
export {
  UserProfileMediaGallery,
  type UserProfileMedia,
  type UserProfileMediaGalleryHandle,
  type UserProfileMediaGalleryProps,
  type UserProfileMediaItem,
} from "./UserProfileMediaGallery";
