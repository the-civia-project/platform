/**
 * Pure routing layer between {@link PostProps} body inputs and the
 * internal body subcomponents under {@link "./Body"} mounts.
 * Classifies via {@link pickPostType}, then derives which slots render
 * (commentary, auto URL line, media / structured tile, archetype teaser)
 * without touching React.
 *
 * Kept framework-free so feed analytics, server-side routing, and Vitest
 * can share the same decisions as the render tree. The stateful shell is
 * {@link "./PostBody".PostBodyByType}; {@link "../use-post-type"} memoises
 * classification for components that only need {@link PostType}.
 *
 * @example
 * ```ts
 * resolvePostBody({
 *   content: "Worth a read",
 *   media: {
 *     kind: "link",
 *     preview: { url: "https://x.test/a", title: "A", domain: "x.test" },
 *   },
 * });
 * // => { kind: "text-url", layout: "standard", tile: "link-preview", ... }
 * ```
 */
import { pickPostType, type PostType, type PostTypeInput } from "../post-type";
import {
  hasMatchingUrlSegment,
  hasPostContent,
} from "./resolve-post-variant";

export {
  hasMatchingUrlSegment,
  hasPostContent,
} from "./resolve-post-variant";

/**
 * Discriminant for which internal body subcomponent should mount. Mirrors
 * the twenty-two {@link PostType} kinds; `null` means no media / teaser
 * slot (plain `text` posts).
 */
export type PostBodyTile =
  | "article-teaser"
  | "liveticker-teaser"
  | "decree-teaser"
  | "testimony-teaser"
  | "link-preview"
  | "image"
  | "video"
  | "audio"
  | "gallery"
  | "mosaic"
  | "carousel"
  | "poll"
  | "event"
  | "petition"
  | "fundraiser"
  | "dataset"
  | "fact-check"
  | "vote-record"
  | "endorsement"
  | "commitment"
  | "disclosure";

/** Alias of {@link PostType}["kind"] for routing tables and tests. */
export type PostBodyKind = PostType["kind"];

/**
 * Body layout mode. Archetype posts replace the entire content + media
 * stack with a single teaser; standard posts stack commentary, optional
 * auto URL line, and optional media tile.
 */
export type PostBodyLayout = "archetype" | "standard";

/**
 * Serializable routing descriptor returned by {@link resolvePostBody}.
 * Consumed by {@link "./Body".PostBodyByType} to decide which
 * subcomponents mount and with which props-derived flags.
 */
export type ResolvedPostBody = {
  /** Classifier output -- same `kind` as {@link pickPostType}. */
  kind: PostBodyKind;
  /** Whether the post uses an archetype teaser instead of content + media. */
  layout: PostBodyLayout;
  /**
   * Which tile subcomponent to mount in the media / teaser slot.
   * `null` when {@link ResolvedPostBody.showMedia} is `false`.
   */
  tile: PostBodyTile | null;
  /**
   * Whether the commentary slot should render. Mirrors the null-check in
   * {@link "./Body".PostBodyContent}: absent, empty string, and empty
   * structured arrays all collapse the slot.
   */
  hasContent: boolean;
  /**
   * Whether to inject the auto URL line between commentary and the OG
   * card for link-preview posts. Suppressed when structured
   * {@link PostUrlSegment} content already carries the same `href`.
   */
  showInlineUrl: boolean;
  /**
   * Whether the media / structured-tile / archetype slot should render.
   * `false` for degenerate `text` posts and for archetype layout's
   * unused media path (teaser is driven by {@link ResolvedPostBody.tile}
   * on the archetype branch instead).
   */
  showMedia: boolean;
  /**
   * Canonical preview URL when {@link ResolvedPostBody.kind} is
   * `text-url`, hoisted from {@link pickPostType}. Omitted otherwise.
   */
  linkUrl?: string;
};

/** Inputs accepted by {@link resolvePostBody} -- same shape as {@link PostTypeInput}. */
export type ResolvePostBodyInput = PostTypeInput;

/**
 * Map a {@link PostType} discriminant to the body tile that renders its
 * attachment or archetype teaser. Returns `null` for `text` only.
 *
 * @param kind - Classifier output kind.
 * @returns The tile key the body router switches on, or `null`.
 */
export function postBodyTileForKind(kind: PostBodyKind): PostBodyTile | null {
  switch (kind) {
    case "text":
      return null;
    case "text-url":
      return "link-preview";
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "gallery":
      return "gallery";
    case "mosaic":
      return "mosaic";
    case "carousel":
      return "carousel";
    case "poll":
      return "poll";
    case "event":
      return "event";
    case "petition":
      return "petition";
    case "fundraiser":
      return "fundraiser";
    case "dataset":
      return "dataset";
    case "fact-check":
      return "fact-check";
    case "vote-record":
      return "vote-record";
    case "endorsement":
      return "endorsement";
    case "commitment":
      return "commitment";
    case "disclosure":
      return "disclosure";
    case "article":
      return "article-teaser";
    case "liveticker":
      return "liveticker-teaser";
    case "decree":
      return "decree-teaser";
    case "testimony":
      return "testimony-teaser";
  }
}

/**
 * Pure router from body-driving {@link PostProps} fields to a
 * {@link ResolvedPostBody}. Delegates classification to
 * {@link pickPostType}; derives slot flags only.
 *
 * @param input - `content`, `media`, and optional `archetype` from a post.
 * @returns Routing descriptor for {@link "./Body".PostBodyByType}.
 */
export function resolvePostBody(input: ResolvePostBodyInput): ResolvedPostBody {
  const { content, media, archetype } = input;
  const postType = pickPostType(input);
  const kind = postType.kind;
  const tile = postBodyTileForKind(kind);

  if (archetype !== undefined) {
    return {
      kind,
      layout: "archetype",
      tile,
      hasContent: false,
      showInlineUrl: false,
      showMedia: tile !== null,
      linkUrl: postType.kind === "text-url" ? postType.url : undefined,
    };
  }

  const hasContent = hasPostContent(content);
  const showMedia = kind !== "text" && media !== undefined;
  const showInlineUrl =
    media?.kind === "link" &&
    !hasMatchingUrlSegment(content, media.preview.url);
  const linkUrl = postType.kind === "text-url" ? postType.url : undefined;

  return {
    kind,
    layout: "standard",
    tile: showMedia ? tile : null,
    hasContent,
    showInlineUrl,
    showMedia,
    linkUrl,
  };
}
