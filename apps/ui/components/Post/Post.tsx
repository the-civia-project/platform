/**
 * Three-tier social post composition wired from kit primitives, rendered as a flat
 * typographic block on the page background -- no surrounding card, border, or fill.
 * The post root always fills its parent's inline width via `alignSelf: "stretch"`
 * (see {@link styles.body}), so every post sized by the kit feels predictable
 * regardless of the surrounding layout: drop a `Post` into any container and it
 * takes whatever width the container offers, no `width: "100%"` wrapper needed.
 *
 * - **Header**: a {@link Profile} row identifying who posted (avatar + name + flag +
 *   optional location). Sits flush with the post's left edge so it lines up with the
 *   body and the action row below.
 * - **Body**: a vertical stack of three optional slots -- {@link PostProps.content}
 *   (commentary text, optionally with inline
 *   {@link PostMentionSegment | @-mentions},
 *   {@link PostUrlSegment | URL links}, and
 *   {@link PostHashtagSegment | #-hashtags} when passed as a structured
 *   {@link PostContent} array; see {@link PostProps.onMentionPress},
 *   {@link PostProps.onUrlPress}, and {@link PostProps.onHashtagPress}
 *   for the per-segment press contracts),
 *   {@link PostProps.media} (a single link preview, image, video,
 *   audio, or gallery attachment), and an optional
 *   {@link PostProps.relation} (a left-railed inset showing the original
 *   post, prefixed by a kind header naming the relationship -- "Reposted"
 *   for {@link RepostRelation}, "Commented" for {@link CommentRelation};
 *   Tier 5 extends the union with quote, correction, and retraction).
 *   Together they support nine content shapes:
 *
 *     1. *Text* -- `content` only.
 *     2. *Text + link preview* -- `content` + `media.kind === "link"` (a resolved
 *        OpenGraph payload rendered as a hairline-bordered embed card). The
 *        kit also auto-renders the underlying URL as a link-toned line above
 *        the OG card so the invariant "a post that surfaces an OpenGraph
 *        preview always shows the URL too" holds without the caller having
 *        to thread the URL into `content` themselves. The URL line and the
 *        OG card share one press intent: both fire `media.onPress` so a
 *        single "open the link" handler powers both affordances. Callers
 *        who *do* want the URL inline in their structured `content` (so it
 *        sits in a specific position mid-sentence rather than on its own
 *        line above the card) can pass a {@link PostUrlSegment} whose
 *        `href` matches `media.preview.url`; the kit detects the duplicate
 *        and suppresses the auto-line.
 *     3. *Text + image* -- `content` + `media.kind === "image"` (a single rounded
 *        photo below the body copy).
 *     4. *Image-only* -- `media.kind === "image"`, `content` omitted.
 *     5. *Video* -- `media.kind === "video"` for a single mock video tile (a
 *        16:9 poster photo with a centered play-button overlay painted on top).
 *        Stands in for a real {@link "expo-av"} / {@link "react-native-video"}
 *        player while the kit's playback pipeline is still upstream of this
 *        file; the surface, accessibility contract, and `kind: "video"` shape
 *        are ready for the player to slot in underneath without rewiring
 *        callers. Pass `content` to caption the video or omit it for a video-
 *        only post. See {@link "../Media".Video}.
 *     6. *Audio* -- `media.kind === "audio"` for a single mock audio pill
 *        (a hairline-bordered row with a primary play button on the left, a
 *        static waveform of vertical bars in the middle, and an optional
 *        duration label on the right). Same "ship the silhouette while the
 *        playback pipeline catches up" pattern as `video`, sized for voice
 *        notes / podcast clips rather than video. Pass `content` to caption
 *        the audio or omit it for an audio-only post. See
 *        {@link "../Media".Audio}.
 *     7. *Gallery* -- `media.kind === "gallery"` with up to four tiles in a Twitter-
 *        style grid (1 full-width / 2 side-by-side / 3 left-plus-stacked / 4+ a 2x2
 *        grid with a "+N" overlay on the fourth tile). `content` may accompany the
 *        gallery as a caption or be omitted entirely.
 *     8. *Mosaic* -- `media.kind === "mosaic"` for a vertical stack of photos at
 *        their natural aspect ratios. Each image fills the post's width and
 *        stretches to its own height, packed flush against the next tile so
 *        the stack reads as one continuous rounded shape (top corners on the
 *        first tile, bottom on the last, square seams in between). Use when
 *        the images deliberately vary in shape (a mix of landscape, portrait,
 *        and square) and you want to preserve those differences rather than
 *        cropping everything into uniform tiles.
 *     9. *Carousel* -- `media.kind === "carousel"` for a horizontal swipeable
 *        single-tile-at-a-time view. Every tile shares the caller-provided
 *        `aspectRatio` (default `1`, Instagram's standard square carousel), with
 *        pagination dots at the bottom indicating the active slide. Use when
 *        every shot is shaped the same and the post is really a sequence (multi-
 *        angle shoots, before/after, photo series). On desktop web only
 *        (`formFactor === "web"`) the carousel also renders a pair of
 *        chevron buttons over the left and right edges of the frame so the
 *        "more slides this way" affordance stays discoverable to click-
 *        driven users; on native *and* web-mobile (both touch-first) the
 *        chevrons are omitted in favour of the swipe gesture. See
 *        {@link "../Media".Carousel} for the full cross-platform behaviour.
 *
 *     Each image-bearing variant encodes its cardinality and uniformity rule
 *     at the type level so the right variant is the one whose types compile:
 *
 *     - `image` -- exactly one photo. {@link ImageMedia.image} is a single
 *       {@link PostImage}, not an array; the type alone forbids "image post
 *       with two photos".
 *     - `gallery` -- 1-4 photos of any shape. The grid layout dictates each
 *       tile's aspect ratio, so per-image `aspectRatio` is honoured only by
 *       the single-image variant of the grid.
 *     - `carousel` -- two or more *uniformly-shaped* photos. The shared
 *       shape lives once on {@link CarouselMedia.aspectRatio};
 *       {@link CarouselImage} has no per-tile `aspectRatio` field, so
 *       callers literally can't disagree about the shape from one slide to
 *       the next.
 *     - `mosaic` -- two or more *differently-shaped* photos. Every
 *       {@link MosaicImage} carries a required `aspectRatio` so the call
 *       site advertises the heterogeneity. {@link "../Media".Mosaic} also
 *       emits a `__DEV__` `console.warn` when every image happens to share
 *       the same aspect ratio at runtime, because that case belongs in
 *       `carousel` (swipeable) or `gallery` (grid) instead.
 *
 *     A kebab-style overflow menu (three vertical dots) floats absolutely at the
 *     body's top-right when {@link PostProps.showMenu} is on; it uses the `inverted`
 *     button variant so its theme-matching fill masks any first-line text that
 *     wraps into the corner. Size `sm` keeps it subordinate to the text and matches
 *     the action-row icons below. When {@link PostProps.relation} is set, the
 *     body grows a left-railed inset below everything else, prefixed by a small
 *     icon + label header indicating the relationship the outer post has with
 *     the embedded one -- "Reposted" for {@link RepostRelation} (sharing),
 *     "Commented" for {@link CommentRelation} (responding). The variants are
 *     mutually exclusive at the type level (the union admits exactly one
 *     {@link PostRelation} at a time). The inset uses the blockquote idiom
 *     (a hairline vertical bar on the left + a left padding) rather than a
 *     bordered box, so we never nest one chromeful surface inside another.
 *     It has no actions or overflow menu of its own; engagement still flows
 *     through the outer post's footer. Pass {@link EmbeddedPostData.onPress}
 *     on the relation's `post` slot to make the entire inset (including the
 *     kind header) pressable -- intended for navigating to the original
 *     post's detail view.
 * - **Footer**: chrome-less icon actions split into two clusters -- Like,
 *   Comment, and Re-post grouped on the left (each with its own optional inline
 *   count), and Bookmark + Share on the right when {@link PostProps.showBookmark}
 *   / {@link PostProps.showShare} are on (both off by default). The left grouping
 *   reads as "engagement"; the right one as "save for later" (Bookmark) and
 *   "outbound distribution" (Share). Bookmark and Share are intentionally
 *   count-less, and the visibility opt-in matches the convention used by
 *   {@link PostProps.showMenu}: surfaces that aren't part of the post's core
 *   reading -- moderation kebab, save, outbound share -- ship hidden so a post in
 *   a context that doesn't need them (composer preview, draft, embedded
 *   reference, etc.) doesn't accrete affordances that the surrounding screen
 *   has to suppress.
 * - **Comments** *(opt-in)*: when {@link PostProps.showComments} is `true`
 *   and {@link PostProps.comments} is non-empty, the thread renders below the action
 *   row inside a {@link Card} -- the *only* nested chromeful surface inside `Post`,
 *   used deliberately because comments are semantically responses *to* the post, not
 *   content *of* it (which is also why {@link EmbeddedPostInset} uses a blockquote
 *   rail instead of its own surface: embedded posts are referenced *by the author*,
 *   comments are added *by other readers*, so they earn their own envelope).
 *   The card opens
 *   with an {@link Eyebrow} that names the section with the server-side count
 *   ("24 COMMENTS"), then lists the comment rows vertically. Each row is a compact
 *   {@link Profile} header (`xs`, inline) over the comment body and a tight Like +
 *   Reply action pair -- the same {@link PostAction} primitive the parent's footer
 *   uses, kept consistent so engagement reads the same one level down. The section
 *   is gated entirely on `showComments`; the collapsed feed-row shape never carries
 *   comments, so a `Post` in a {@link "../Feed".Feed} stays tight regardless of
 *   `comments`. Flip `showComments` (typically from {@link PostProps.onCommentPress}
 *   or on navigation to the post's detail view) to surface the thread.
 *   {@link PostProps.commentCount} and {@link PostProps.comments} stay orthogonal --
 *   the count is the server-side total and feeds the eyebrow label; the array is
 *   whatever subset the caller chose to load for rendering -- so the two can
 *   legitimately disagree on count ("24 COMMENTS" above a list of three).
 *
 * Every press handler is optional; pass them to wire real behaviour. The icon-only
 * actions lean on {@link IconButton}'s `full-ghost` default to keep the footer
 * visually quiet so the body copy keeps the most weight.
 */
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react-native";
import {
  Ban,
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Quote,
  Repeat2,
  Reply,
  Share2,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { IconButton } from "../Button";
import { Card } from "../card";
import {
  type AudioData,
  type CarouselImage,
  type ImageData,
  type LinkPreviewData,
  type MosaicImage,
  type VideoData,
} from "../Media";
import Profile, { type ProfileProps } from "../Profile";
import { Eyebrow, Text } from "../Typography";
import type { Theme } from "../theme";
import { useTheme } from "../use-theme";
import { type PostArticle } from "./Article";
import { type PostCommitment } from "./Commitment";
import { type PostDecree } from "./Decree";
import { type PostDataset } from "./Dataset";
import { type PostDisclosure } from "./Disclosure";
import { type PostEndorsement } from "./Endorsement";
import { type PostEvent } from "./Event";
import {
  type FactCheckVerdict,
  type PostFactCheck,
} from "./FactCheck";
import { type PostFundraiser } from "./Fundraiser";
import { type PostLiveticker } from "./Liveticker";
import { PostBodyByType } from "./PostBody";
import { type PostPetition } from "./Petition";
import { type PostPoll } from "./Poll";
import { resolvePostVariant } from "./resolve-post-variant";
import { type PostTestimony } from "./Testimony";
import { type PostVoteChoice, type PostVoteRecord } from "./VoteRecord";
import {
  usePostType,
  type PostType,
  type PostTypeInput,
} from "../use-post-type";

// Re-export the moved tile-data types so external consumers (`PostScreen`,
// `FeedScreen`, demos, future feeds) keep working without a rename pass.
// The standalone media surface owns the canonical definitions; this file
// just stays as the convenient one-stop import for the Post-level types
// like {@link PostMedia}, {@link MosaicMedia}, {@link CarouselMedia}.
export { type CarouselImage, type MosaicImage };
// Re-export the post-type surface so consumers can grab {@link PostType}
// and {@link usePostType} alongside {@link PostProps} from the same
// module. The pure classifier ({@link pickPostType}) stays in
// `../post-type`; the React hook in `../use-post-type` is what the kit
// surface advertises.
export { usePostType, type PostType, type PostTypeInput };
export {
  resolvePostVariant,
  type PostVariantKind,
  type ResolvedPostVariant,
  hasPostContent,
  hasMatchingUrlSegment,
} from "./resolve-post-variant";
export {
  resolvePostBody,
  type PostBodyKind,
  type PostBodyTile,
  type ResolvedPostBody,
} from "./resolve-post-body";
/** Alias of {@link ImageData} -- kept for backward compatibility. */
export type PostImage = ImageData;
/**
 * Alias of {@link VideoData} -- the per-post video tile shape exposed
 * alongside {@link PostImage} so callers building structured records
 * (feed rows, drafts) can type the photo and video slots with parallel
 * names regardless of which one they end up populating.
 */
export type PostVideo = VideoData;
/**
 * Alias of {@link AudioData} -- the per-post audio shape exposed
 * alongside {@link PostImage} / {@link PostVideo} so callers building
 * structured records (feed rows, drafts) can type the three media
 * slots with parallel names regardless of which one they end up
 * populating.
 */
export type PostAudio = AudioData;

/**
 * Plain-text run inside a structured {@link PostContent} array. Carries no
 * styling -- the rendered run inherits the body's font and color from the
 * outer {@link Text} wrapper. Use to interleave commentary around
 * {@link PostMentionSegment} entries when a post body tags one or more
 * users inline.
 */
export type PostTextSegment = {
  /** Discriminant; selects the plain-text run shape. */
  kind: "text";
  /**
   * Literal text rendered as-is. Whitespace is preserved; callers are
   * responsible for inserting their own spacing around adjacent mentions
   * (the kit doesn't auto-insert spaces between segments because some
   * mention chains -- `@a/@b`, `@a, @b` -- want different separators).
   */
  text: string;
};

/**
 * Inline `@`-mention of a user inside a structured {@link PostContent}
 * array. The kit renders the mention in {@link Theme.primary} (the same
 * link tone as {@link "../Button".Button} `variant="link"`) and wires it
 * up as an accessibility link when {@link PostProps.onMentionPress} is
 * set. Use to tag a user mid-sentence; the kit doesn't parse `@` tokens
 * out of plain {@link PostTextSegment | text runs}, so the structured
 * form is the only way to mark a mention as actionable.
 */
export type PostMentionSegment = {
  /** Discriminant; selects the mention shape. */
  kind: "mention";
  /**
   * The mentioned user's handle **without** the leading `@`. Fired
   * verbatim into {@link PostProps.onMentionPress} on press, and used as
   * the fallback display text (rendered with a leading `@`) when
   * {@link display} is omitted.
   */
  handle: string;
  /**
   * Optional display override -- typically the user's full name
   * (`"Aria Popescu"`) when the surrounding copy reads more naturally
   * with a display name than a raw handle (`"@Aria Popescu for the
   * review"` vs `"@aria.popescu for the review"`). The kit prefixes
   * either form with a literal `@`, so the rendered mention always
   * surfaces the `@` affordance regardless of which body the caller
   * chose -- `display` swaps what comes *after* the `@`, never
   * removes it. When `display` is absent, the mention renders as
   * `@${handle}`, matching the Mastodon convention the kit's
   * {@link "./validation/handle".validateHandle} enforces.
   */
  display?: string;
};

/**
 * Inline URL link inside a structured {@link PostContent} array. The
 * kit renders the link in {@link Theme.primary} (the same link tone
 * shared with {@link PostMentionSegment} and
 * {@link "../Button".Button} `variant="link"`) and wires it up as an
 * accessibility link when {@link PostProps.onUrlPress} is set. Like
 * mentions, the kit does **not** parse `https://` tokens out of plain
 * {@link PostTextSegment | text runs}: the structured form is the
 * only way to mark a URL as actionable, so a literal `https://` in
 * body copy (a code example, a quoted CLI command, etc.) stays
 * inert.
 *
 * URLs are **always visible** -- the kit prettifies
 * {@link PostUrlSegment.href} via {@link "../post-url".prettifyUrl}
 * (strip `https://`/`http://`, strip a leading `www.`, trim a
 * trailing `/`, truncate at
 * {@link "../post-url".DEFAULT_PRETTY_URL_LENGTH} characters with an
 * ellipsis) but never lets the caller hide the URL behind an
 * arbitrary anchor-text override. Mentions and URLs differ here
 * deliberately: a mention's `@`+display is still visibly a handle
 * affordance, but an opaque label like `"docs"` over a URL hides
 * which site the reader is about to visit. The full `href` is
 * what the kit hands to {@link PostProps.onUrlPress} on press, so
 * callers route on the raw URL regardless of the prettified display.
 */
export type PostUrlSegment = {
  /** Discriminant; selects the URL shape. */
  kind: "url";
  /**
   * The full URL to open. Passed verbatim into
   * {@link PostProps.onUrlPress} on press; also drives the visible
   * label (via {@link "../post-url".prettifyUrl}). Not validated by
   * the kit -- if you want strict URL validation, run
   * {@link "./validation/url".validateUrl} before building the
   * segment.
   */
  href: string;
};

/**
 * Inline hashtag inside a structured {@link PostContent} array. The
 * kit renders the hashtag in {@link Theme.primary} (the same link
 * tone shared with {@link PostMentionSegment},
 * {@link PostUrlSegment}, and {@link "../Button".Button}
 * `variant="link"`) with a literal `#` prefix prepended, and wires
 * it up as an accessibility link when
 * {@link PostProps.onHashtagPress} is set. Like mentions and URLs,
 * the kit does **not** parse `#` tokens out of plain
 * {@link PostTextSegment | text runs}: the structured form is the
 * only way to mark a hashtag as actionable, so a literal `#` in
 * body copy (a numbered list, a markdown heading example, a
 * temperature reading) stays inert.
 *
 * Unlike {@link PostMentionSegment} (which supports a `display`
 * override that swaps what comes after the `@`), hashtags don't
 * carry a display override -- they render as `#${tag}` always.
 * The `#` prefix is half the affordance; stripping it would make
 * the hashtag indistinguishable from surrounding copy.
 * {@link PostUrlSegment} doesn't carry an override either, but for
 * the opposite reason: URLs must stay fully visible so readers can
 * see which site they're about to visit (no anchor-text deception).
 */
export type PostHashtagSegment = {
  /** Discriminant; selects the hashtag shape. */
  kind: "hashtag";
  /**
   * The hashtag's body, **without** the leading `#`. Fired verbatim
   * into {@link PostProps.onHashtagPress} on press, and used to
   * build the displayed `#${tag}` label. The kit doesn't case-fold
   * or otherwise normalise the value; routing semantics
   * (case-insensitive matching, slugification, ASCII folding) are
   * the caller's call. Not validated by the kit -- pass any string;
   * if you want to enforce a hashtag grammar, do it before building
   * the segment.
   */
  tag: string;
};

/**
 * One segment in a structured {@link PostContent} array. Plain text,
 * a tagged user, an inline URL link, or an inline hashtag -- arrays
 * of segments compose into a single body paragraph that wraps as a
 * normal {@link Text} run.
 */
export type PostContentSegment =
  | PostTextSegment
  | PostMentionSegment
  | PostUrlSegment
  | PostHashtagSegment;

/**
 * Shape of {@link PostProps.content}. Either a plain string (the
 * original API, kept for the common case where a post has no inline
 * tags) or an array of {@link PostContentSegment} entries when the post
 * tags users inline -- see {@link PostMentionSegment} for the mention
 * shape and {@link PostProps.onMentionPress} for the press contract.
 *
 * Strings always render as a single text run; arrays render as a
 * single paragraph with mentions, URL links, and hashtags
 * interleaved at the caller-specified boundaries. The kit does
 * **not** parse `@handle`, `https://`, or `#tag` tokens out of plain
 * strings -- if a post needs actionable mentions, URLs, or
 * hashtags, the caller passes the structured form so the boundaries
 * are unambiguous and literal `@`s, `https://`s, or `#`s in body
 * copy (an email address, a CLI command, a code example, a
 * numbered list) stay inert.
 */
export type PostContent = string | PostContentSegment[];
/**
 * Alias of {@link LinkPreviewData} -- kept for backward compatibility.
 * The canonical link-preview data type now lives in `../Media/LinkPreview`
 * so both {@link Post} and {@link "./PostComposer".PostComposer} can share
 * the same shape; this alias keeps existing consumers compiling without a
 * rename pass.
 */
export type LinkPreview = LinkPreviewData;

/**
 * Shape of the original post embedded inside an outer post. Carries the same body
 * slots as a standalone {@link Post} ({@link PostProps.content},
 * {@link PostProps.media}, {@link PostProps.archetype}) so repost / comment insets
 * can render the referenced row's true post type -- not just a text stub. Engagement
 * counts, action handlers, and the overflow menu stay on the outer post.
 *
 * Carried inside every variant of {@link PostRelation}. The relation discriminant
 * (and fields like {@link QuoteRelation.passage}) layers context on top.
 *
 * The inset renders {@link EmbeddedPostData.author} through {@link Profile} with both
 * `size="xs"` and `inline` set. Pass the original author record verbatim.
 */
export type EmbeddedPostData = {
  /**
   * Author of the original post being referenced. Rendered via {@link Profile} with
   * `size="xs"` and `inline` enabled -- name, flag, and optional `from` collapse onto
   * a single line.
   */
  author: ProfileProps;
  /**
   * Commentary / structured body of the original. Same contract as
   * {@link PostProps.content} -- omit for media-only or archetype-only embeds.
   */
  content?: PostContent;
  /**
   * Attachment on the original post. When set, the inset mounts the same
   * post-TYPE tile the outer row would use ({@link PostBodyByType}).
   */
  media?: PostMedia;
  /**
   * Whole-post archetype teaser on the original. Mutually exclusive with
   * {@link EmbeddedPostData.media} per {@link pickPostType} rules.
   */
  archetype?: PostArchetype;
  /**
   * Optional press handler. When set, the entire inset becomes a `Pressable` with
   * `accessibilityRole="button"` and a subtle scale-down on press feedback, intended
   * for navigating to the original post's detail view. Also forwarded as
   * {@link PostVariantInput.onArchetypePress} when an archetype teaser is present.
   *
   * Mutually exclusive with the outer post's engagement; tapping anywhere outside the
   * inset still triggers the outer post's action row, never this handler.
   */
  onPress?: () => void;
};

/**
 * Repost variant of {@link PostRelation}. The outer post is *sharing* the
 * embedded original with optional commentary in the outer
 * {@link PostProps.content}; the inset above the embedded body gets a
 * "Reposted" header with a repeat icon. Engagement props on the outer post
 * count for the *repost itself*, not the original.
 */
export type RepostRelation = {
  /** Discriminant; selects the repost shape. */
  kind: "repost";
  /** The original post being re-shared. See {@link EmbeddedPostData}. */
  post: EmbeddedPostData;
};

/**
 * Comment variant of {@link PostRelation}. The outer post is *responding*
 * to the embedded original (the outer {@link PostProps.content} is the
 * response); the inset above the embedded body gets a "Commented" header
 * with a comment icon. Structurally identical to {@link RepostRelation} --
 * the difference is purely semantic and surfaces only through the
 * indicator above the inset.
 */
export type CommentRelation = {
  /** Discriminant; selects the comment shape. */
  kind: "comment";
  /** The original post being responded to. See {@link EmbeddedPostData}. */
  post: EmbeddedPostData;
};

/**
 * Quote variant of {@link PostRelation}. The outer post is highlighting a
 * specific *passage* of the referenced original (typically because the
 * outer commentary is responding to that span directly, not to the whole
 * post). The inset replaces the embedded post's full body with the
 * isolated passage, styled as a blockquote with surrounding quotation
 * marks, under a "Quoted" header.
 *
 * The {@link EmbeddedPostData.content} slot on the referenced post is
 * still required (so the underlying record matches the shape every
 * relation variant carries), but it isn't shown when rendered as a quote
 * -- the {@link QuoteRelation.passage} is what reads. The full content
 * is therefore the **source string** the passage was drawn from; product
 * code can use it for navigation / source-of-truth lookup without that
 * leaking into the rendered surface.
 */
export type QuoteRelation = {
  /** Discriminant; selects the quote shape. */
  kind: "quote";
  /**
   * The original post the passage is drawn from. Only the {@link EmbeddedPostData.author}
   * row is rendered alongside the passage; the full
   * {@link EmbeddedPostData.content} stays accessible on the record so
   * navigation handlers can resolve the source without re-fetching.
   */
  post: EmbeddedPostData;
  /**
   * The highlighted span of the referenced post -- a verbatim quote
   * the outer poster is anchoring their commentary to. Rendered
   * inside the inset's rail with surrounding quotation marks and a
   * slightly italicised treatment; no kit-side normalisation runs on
   * this string, so callers should pass the passage exactly as it
   * appears in the source.
   */
  passage: string;
};

/**
 * Correction variant of {@link PostRelation}. The outer post is the
 * *correction itself* (issued by the original author, or by an editor
 * acting on the author's behalf) and the embedded record is the post
 * being corrected. The inset above the embedded body gets a
 * "Correction" header with a pencil icon, and the
 * {@link CorrectionRelation.note} renders inside the rail below the
 * original copy as the kit's lightweight equivalent of an "editor's
 * note" eyebrow.
 *
 * Semantically distinct from {@link RetractionRelation}: a correction
 * *amends* the original (the post stays in the public record, with the
 * correction attached); a retraction *withdraws* it. Modelled as
 * separate variants so the visual treatment and the audit trail can
 * diverge.
 */
export type CorrectionRelation = {
  /** Discriminant; selects the correction shape. */
  kind: "correction";
  /**
   * The post being corrected. {@link EmbeddedPostData.content} is the
   * original copy (rendered verbatim in the inset's rail) and the
   * author row identifies who issued the post that's being corrected.
   */
  post: EmbeddedPostData;
  /**
   * Plain-language note explaining what was wrong and what's been fixed.
   * Rendered below the original copy under a "Correction:" label. No
   * kit-side normalisation; product code passes the prose verbatim.
   */
  note: string;
};

/**
 * Retraction variant of {@link PostRelation}. The outer post is the
 * *retraction itself* and the embedded record is the post being
 * withdrawn. The inset above the embedded body gets a "Retracted"
 * header with a ban icon, and the embedded copy renders with a
 * line-through treatment so the strikethrough signals "this no
 * longer stands" at a glance even when readers don't slow down to
 * parse the eyebrow. The {@link RetractionRelation.reason} renders
 * below the struck-through copy under a "Retracted:" label.
 *
 * Semantically distinct from {@link CorrectionRelation}: a correction
 * *amends* the original (it stays public, with the correction
 * attached); a retraction *withdraws* it entirely. The strikethrough
 * is the visual encoding of that distinction.
 */
export type RetractionRelation = {
  /** Discriminant; selects the retraction shape. */
  kind: "retraction";
  /**
   * The post being retracted. {@link EmbeddedPostData.content} is the
   * original copy (rendered with a strikethrough in the inset's rail)
   * and the author row identifies who issued the post that's being
   * withdrawn.
   */
  post: EmbeddedPostData;
  /**
   * Plain-language reason for the retraction. Rendered below the
   * struck-through original copy under a "Retracted:" label. No
   * kit-side normalisation; product code passes the prose verbatim.
   */
  reason: string;
};

/**
 * Discriminated union for the optional {@link PostProps.relation} slot --
 * the "outer post references another post" axis. Five variants
 * ({@link RepostRelation}, {@link CommentRelation}, {@link QuoteRelation},
 * {@link CorrectionRelation}, {@link RetractionRelation}) cover every
 * cross-reference shape the kit ships today; the union is open to
 * further variants as the platform grows.
 *
 * Mutual exclusion is encoded at the type level (exactly one variant per
 * post) rather than via runtime precedence between sibling fields, which
 * is the explicit reason this axis replaced the previous
 * `repostedPost` / `commentedPost` pair on {@link PostProps}.
 */
export type PostRelation =
  | RepostRelation
  | CommentRelation
  | QuoteRelation
  | CorrectionRelation
  | RetractionRelation;

/**
 * Discriminated union for the optional {@link PostProps.archetype} slot --
 * the "this post is a whole-post archetype" axis. Tier 3+ extends this union
 * with kinds where the structured payload *is* the post (long-form articles,
 * append-only tickers, signed proclamations, witness statements) so they can
 * opt out of the standard {@link PostProps.content} + {@link PostProps.media}
 * body and render their own teaser instead. The feed row mounts the matching
 * teaser; full views live in sibling components (e.g. {@link "./Article".default}).
 *
 * {@link PostProps.archetype} takes precedence over {@link PostProps.media} for
 * both classification ({@link pickPostType}) and rendering: when set, the
 * standard body slots are suppressed in favour of the archetype teaser.
 */
export type PostArchetype =
  | {
      /** Long-form editorial article; teaser uses {@link "./Article".ArticleTeaser}. */
      kind: "article";
      /** Article metadata and body for the full view. */
      article: PostArticle;
    }
  | {
      /**
       * Append-only event ticker; teaser uses {@link "./Liveticker".LivetickerTeaser}.
       */
      kind: "liveticker";
      /** Liveticker entries and status for both teaser and full view. */
      liveticker: PostLiveticker;
    }
  | {
      /**
       * Issued decree / ordinance; teaser uses {@link "./Decree".DecreeTeaser}.
       */
      kind: "decree";
      /** Decree metadata for teaser and full {@link "./Decree".default} view. */
      decree: PostDecree;
    }
  | {
      /**
       * Witness testimony record; teaser uses {@link "./Testimony".TestimonyTeaser}.
       */
      kind: "testimony";
      /** Testimony payload for teaser and full {@link "./Testimony".default} view. */
      testimony: PostTestimony;
    };

/**
 * One row in the comment thread rendered below a {@link Post}'s action
 * row. Each comment is a compact composition: an `xs`-sized inline {@link Profile}
 * header (avatar + name + flag, no second line) over the body copy and a tight
 * Like + Reply action pair built from the same {@link PostAction} primitive the
 * parent post's footer uses -- so engagement reads identically one level down.
 *
 * The shape stays deliberately flat (no nested replies, no media attachments,
 * no timestamp). Threaded discussions and per-comment media are higher-order
 * concerns; product code wraps {@link Post} to compose them. The kit primitive
 * just covers the "list of leaf comments" case, which is what every social feed
 * needs in its detail view.
 */
export type PostComment = {
  /**
   * Stable identifier for the comment. Used as the React `key` when the
   * comment list renders, so it must be unique across the post's
   * {@link PostProps.comments} array and stable across re-renders -- the
   * same comment should keep the same id when the thread is refetched.
   */
  id: string;
  /**
   * Author of the comment -- forwarded verbatim to a {@link Profile} row with
   * `size="xs"` and `inline` set. `from` is honoured if present, but typically
   * omitted at the call site: comments use the tightest density preset so the
   * location segment crowds the row when included. Drop `from` from the author
   * record to render just name + flag, matching most clients' comment header.
   */
  author: ProfileProps;
  /** Comment body copy. Wraps across lines under the {@link Profile} header. */
  content: string;
  /**
   * Optional like count rendered next to the comment's Like action.
   * Hidden at `0` / `undefined` so a brand-new comment collapses to a
   * clean icon-only row, mirroring the outer post's footer behaviour.
   * When {@link PostComment.liked} is `true`, the displayed count is
   * clamped up to at least `1` -- same invariant the outer post enforces
   * on {@link PostProps.likeCount} -- so a filled red heart on the
   * comment never reads as "I liked this with zero likes".
   */
  likeCount?: number;
  /**
   * When `true`, the comment's Like action renders in its filled-red active
   * treatment -- same palette as the outer post's Like, so a viewer-liked
   * comment reads with the same engagement-toggle semantics as a viewer-liked
   * post.
   * @defaultValue false
   */
  liked?: boolean;
  /**
   * Press handler for the comment's Like action. Wire to your "like/unlike
   * this comment" mutation; the parent flips {@link liked} from inside this
   * handler to surface the new state.
   */
  onLikePress?: () => void;
  /**
   * Press handler for the comment's Reply action. The kit primitive doesn't
   * render an inline reply composer -- that's a product-level concern --
   * but the icon is rendered unconditionally so the row has a consistent
   * shape and the screen-reader announcement reads "Reply to <author>".
   */
  onReplyPress?: () => void;
};

/**
 * Link-preview variant of {@link PostMedia}. Renders two affordances
 * stacked above the OG preview:
 *
 * 1. A {@link prettifyUrl}-styled URL line in the kit's link tone,
 *    auto-injected by the kit immediately below the body commentary.
 *    This guarantees the invariant "an OpenGraph card always shows
 *    the URL it points at" -- callers don't have to copy the URL
 *    into their `content` prop, the kit owns surfacing it.
 * 2. A hairline-bordered embed card with the thumbnail on top and
 *    the OG metadata stack underneath, rendered via the standalone
 *    {@link "../Media".LinkPreview} primitive.
 *
 * Both affordances share a single press intent ({@link LinkMedia.onPress})
 * so a single "open the link" handler powers both -- tap the body URL
 * or tap the card, same callback fires.
 *
 * If a caller wants to render the URL inline mid-sentence (so the
 * URL sits in a specific position around their commentary rather
 * than on its own auto-injected line above the card), they can
 * pass a {@link PostUrlSegment} inside structured
 * {@link PostContent} whose `href` matches `preview.url`. The kit
 * detects the duplicate and suppresses the auto-injected URL line
 * so the body never shows the same URL twice.
 */
export type LinkMedia = {
  /** Discriminant; selects the link-preview shape. */
  kind: "link";
  /**
   * Resolved OpenGraph payload -- see {@link LinkPreviewData}. The
   * `url` field powers both the OG card's destination *and* the
   * auto-injected URL line in the body, so a single source of
   * truth feeds the whole link-preview surface.
   */
  preview: LinkPreviewData;
  /**
   * Optional press handler. When set, both the OG preview card *and*
   * the auto-injected URL line above it become pressable, sharing
   * the same `DisclosureCard`-style press feedback as
   * {@link EmbeddedPostData.onPress}. Typical use is
   * `() => Linking.openURL(preview.url)` to launch the link in an
   * external browser. When `undefined`, both affordances still
   * render but are inert.
   */
  onPress?: () => void;
};

/**
 * Single-image variant of {@link PostMedia}. Renders the photo at the caller-
 * provided {@link PostImage.aspectRatio} (or `16/9` by default) with the kit's
 * standard rounded-rectangle treatment.
 */
export type ImageMedia = {
  /** Discriminant; selects the single-image shape. */
  kind: "image";
  /** Photo to render. See {@link PostImage}. */
  image: PostImage;
  /**
   * Optional press handler. When set, the image becomes a `Pressable` with the
   * kit's standard press feedback. Typical use is to open the photo in a full-
   * screen previewer.
   */
  onPress?: () => void;
};

/**
 * Single-video variant of {@link PostMedia}. Renders a mock video tile
 * via {@link "../Media".Video} -- the poster photo at the caller-
 * provided {@link PostVideo.aspectRatio} (or `16/9` by default) with a
 * centered play-button overlay painted on top. Stands in for a real
 * player while the kit's playback pipeline is still upstream of this
 * file; the surrounding shape (composer staging, feed row dispatch,
 * post-type classification) is wired up today so consumers can model
 * video posts as a first-class kind.
 */
export type VideoMedia = {
  /** Discriminant; selects the single-video shape. */
  kind: "video";
  /** Video to render. See {@link PostVideo}. */
  video: PostVideo;
  /**
   * Optional press handler. When set, the tile becomes a `Pressable`
   * with the kit's standard press feedback. Typical use is to open the
   * video in a full-screen player; until the real player lands, this is
   * just the surface where that intent will dock.
   */
  onPress?: () => void;
};

/**
 * Single-audio variant of {@link PostMedia}. Renders a mock audio pill
 * via {@link "../Media".Audio} -- a hairline-bordered row with a primary
 * play button on the left, a deterministic waveform of vertical bars
 * in the middle, and an optional duration label on the right.
 *
 * Stands in for the eventual voice-note / podcast surface while the
 * kit's playback pipeline is still upstream of this file; the
 * surrounding shape (composer staging, feed row dispatch, post-type
 * classification) is wired up today so consumers can model audio
 * posts as a first-class kind. When real playback lands the
 * {@link AudioMedia.onPress} handler is the docking point for "start
 * playback" -- everything else (`source`, `peaks`, `durationSeconds`)
 * stays the same shape.
 */
export type AudioMedia = {
  /** Discriminant; selects the single-audio shape. */
  kind: "audio";
  /** Audio to render. See {@link PostAudio}. */
  audio: PostAudio;
  /**
   * Optional press handler. Wired to the {@link "../Media".Audio} pill's
   * play button: pressing it fires this callback (typical use is to
   * start playback in your audio engine). When omitted, the play
   * button still renders but is inert -- matching the same "optional
   * press" convention {@link ImageMedia} and {@link VideoMedia} use.
   */
  onPress?: () => void;
};

/**
 * Multi-image variant of {@link PostMedia}. Lays out the first up to four
 * {@link PostImage} entries in a Twitter-style grid and surfaces any extras
 * through a `+N` scrim on the fourth tile.
 */
export type GalleryMedia = {
  /** Discriminant; selects the gallery shape. */
  kind: "gallery";
  /**
   * One or more photos. Tile layout switches on `images.length`: a single image
   * renders identically to the {@link ImageMedia} variant, two render side-by-
   * side as 1:1 tiles, three render as one full-height tile plus two stacked
   * tiles on the right, and four-or-more render as a 2x2 grid. Any photos past
   * the fourth are hidden behind a `+N` overlay on the fourth tile and remain
   * addressable through {@link onImagePress}.
   */
  images: PostImage[];
  /**
   * Optional press handler invoked with the 0-based index of the tapped tile.
   * Wire to your full-screen previewer so it opens the matching slide. The
   * `+N` overlay shares the fourth tile's handler -- tapping it should open
   * the previewer at index 3 and let the user swipe through the rest.
   */
  onImagePress?: (index: number) => void;
};

/**
 * Mixed-aspect variant of {@link PostMedia}. Renders the photos as a vertical
 * stack, each tile sized to the post's full inline width and to its own
 * {@link MosaicImage.aspectRatio} so the natural shape of every photo is
 * preserved. Use when a post deliberately mixes landscape, portrait, and
 * square shots and cropping them into a uniform {@link GalleryMedia} grid
 * would lose information.
 *
 * The contract for "mixed aspects" is encoded two ways:
 *
 * 1. {@link MosaicImage.aspectRatio} is **required** -- every tile must
 *    declare its shape, which makes it visible at the call site that the
 *    mosaic is supposed to be heterogeneous.
 * 2. {@link "../Media".Mosaic} emits a `__DEV__` `console.warn` when every
 *    image happens to share the same aspect ratio at runtime, nudging
 *    callers towards {@link CarouselMedia} (uniform, swipeable) or
 *    {@link GalleryMedia} (uniform, grid).
 */
export type MosaicMedia = {
  /** Discriminant; selects the mosaic shape. */
  kind: "mosaic";
  /**
   * Photos to render, top-to-bottom. Each tile renders at full inline width
   * and at its declared {@link MosaicImage.aspectRatio}. A 6px vertical gap
   * separates adjacent tiles so the stack reads as a "mosaic of distinct
   * images" rather than one continuous block.
   */
  images: MosaicImage[];
  /**
   * Optional press handler invoked with the 0-based index of the tapped tile.
   * Wire to your full-screen previewer so it opens the matching slide.
   */
  onImagePress?: (index: number) => void;
};

/**
 * Swipeable single-tile-at-a-time variant of {@link PostMedia}. Delegates to
 * the standalone {@link "../Media".Carousel} for rendering: a horizontal
 * paged scroll-view with chevron overlays on desktop web and a row of
 * pagination dots below. Every tile shares {@link CarouselMedia.aspectRatio}
 * so the frame's height never changes between slides.
 *
 * Use when the post is a *sequence* (multi-angle shoot, before/after, photo
 * series) and the photos are deliberately uniform in shape. Reach for
 * {@link MosaicMedia} instead when the images vary in aspect, and for
 * {@link GalleryMedia} when you want every photo visible at once in a
 * Twitter-style grid.
 *
 * The "uniform shape" contract is encoded at the type level: the `images`
 * array is typed as {@link CarouselImage}, which has no per-tile
 * `aspectRatio`. The shared shape lives on
 * {@link CarouselMedia.aspectRatio}.
 */
export type CarouselMedia = {
  /** Discriminant; selects the carousel shape. */
  kind: "carousel";
  /**
   * Photos in display order. The carousel pages through them one-at-a-time;
   * each tile is sized to the frame's full width. A single-image carousel
   * renders as a single tile with no dots (degenerate but valid -- callers
   * shouldn't normally use the variant with `images.length === 1`, but the
   * component handles it without complaint).
   */
  images: CarouselImage[];
  /**
   * Uniform aspect ratio (width / height) applied to every tile in the
   * carousel. Defaults to `1` (square) -- the Instagram-standard carousel
   * shape. Pass `4/5` for a Twitter-style portrait carousel or any other
   * ratio that suits the series.
   * @defaultValue 1
   */
  aspectRatio?: number;
  /**
   * Optional press handler invoked with the 0-based index of the tapped tile.
   * The active tile receives the press; swipes don't fire this handler --
   * they update the carousel's internal active-page state silently. Wire to
   * your full-screen previewer so it opens at the matching slide.
   */
  onImagePress?: (index: number) => void;
};

/**
 * Poll variant of {@link PostMedia}. Renders a structured ballot tile
 * via {@link "./Poll".Poll} -- the question, each option as a
 * percentage-bar row, and a footer with the total tally and an
 * optional deadline. Visual silhouette only: the real ballot pipeline
 * (option selection persistence, deduplication, deadline enforcement,
 * public-tally aggregation) lives upstream of this file, same precedent
 * as {@link "../Media".Video} / {@link "../Media".Audio}.
 *
 * Use for casual polls *and* formal public consultations -- the kit
 * doesn't distinguish; the surrounding identity context (citizen vs
 * official capacity on the {@link Profile} header) supplies the
 * weight.
 */
export type PollMedia = {
  /** Discriminant; selects the poll shape. */
  kind: "poll";
  /** Poll to render. See {@link "./Poll".PostPoll}. */
  poll: PostPoll;
  /**
   * Optional press handler invoked with the
   * {@link "./Poll".PostPollOption.id} of the tapped option. Only fires
   * when the viewer hasn't already voted -- when
   * {@link "./Poll".PostPoll.viewerVoteId} is set the rows render as
   * static and this handler is never invoked.
   */
  onVotePress?: (optionId: string) => void;
};

/**
 * Event variant of {@link PostMedia}. Renders a structured event-
 * card via {@link "./Event".Event} -- date stack, title, time range,
 * place, online / in-person flag, RSVP count, and an optional
 * "RSVP" / "Going" affordance. Visual silhouette only: the real
 * event pipeline (RSVP records, reminders, ticketing, calendar
 * exports, deadline enforcement) lives upstream of this file, same
 * precedent as {@link "../Media".Video} / {@link PollMedia}.
 *
 * Use for community town halls, public consultations, candidate
 * debates, civic-association meetings, and other gatherings where
 * the *when* + *where* + *who's going* is the post's primary
 * payload. Casual "drinks tonight" events fit too -- the kit
 * doesn't distinguish; the surrounding identity context supplies
 * the weight.
 */
export type EventMedia = {
  /** Discriminant; selects the event shape. */
  kind: "event";
  /** Event to render. See {@link "./Event".PostEvent}. */
  event: PostEvent;
  /**
   * Optional press handler invoked when the viewer taps the RSVP
   * button on the tile. Only relevant when the kit renders the
   * button (which it does whenever this handler is wired);
   * {@link "./Event".PostEvent.viewerRsvped} controls the label
   * ("Going" vs "RSVP"). The kit doesn't deduplicate presses -- the
   * upstream pipeline owns "one RSVP per identity".
   */
  onRsvpPress?: () => void;
};

/**
 * Petition variant of {@link PostMedia}. Renders a structured
 * petition tile via {@link "./Petition".Petition} -- "Petition"
 * eyebrow, ask title and supporting paragraph, an optional progress
 * bar (when {@link "./Petition".PostPetition.goal} is set), and a
 * footer row with the signature tally, an optional deadline label,
 * and an optional "Sign" / "Signed" affordance. Visual silhouette
 * only: the real signature pipeline (identity-bound records, public
 * counters, deadline enforcement, downloadable signature lists)
 * lives upstream of this file, same precedent the rest of the
 * structured tiles follow.
 *
 * Use for local "fix the night bus" community petitions, formal
 * council-bound petitions with a target threshold, NGO advocacy
 * pushes, etc. The kit doesn't distinguish; identity-class chrome on
 * the surrounding {@link "../Profile".Profile} header carries the
 * weight (a signed petition from a verified citizen reads
 * differently from one from a media outlet).
 */
export type PetitionMedia = {
  /** Discriminant; selects the petition shape. */
  kind: "petition";
  /** Petition to render. See {@link "./Petition".PostPetition}. */
  petition: PostPetition;
  /**
   * Optional press handler invoked when the viewer taps the Sign
   * button. The kit only fires the handler when
   * {@link "./Petition".PostPetition.viewerSigned} is unset or
   * `false` -- re-signing is a meaningless operation because the
   * upstream pipeline keys on identity.
   */
  onSignPress?: () => void;
};

/**
 * Fundraiser variant of {@link PostMedia}. Renders a structured
 * fundraiser tile via {@link "./Fundraiser".Fundraiser} -- header
 * eyebrow, cause title and pitch, money progress bar, footer with
 * raised + goal + optional deadline, optional Donate affordance,
 * and an optional transparency-link row. Visual silhouette only:
 * the real payment / donation pipeline (identity-bound donation
 * records, ledger / public spend reports, currency conversion,
 * deadline enforcement) lives upstream of this file.
 *
 * Donations come in multiple rounds, so there is no "viewer has
 * already given" inert state -- a donor can give again. Use the
 * surrounding identity context (citizen / NGO / official capacity)
 * on the {@link "../Profile".Profile} header to carry the weight
 * the kit can't on its own.
 */
export type FundraiserMedia = {
  /** Discriminant; selects the fundraiser shape. */
  kind: "fundraiser";
  /** Fundraiser to render. See {@link "./Fundraiser".PostFundraiser}. */
  fundraiser: PostFundraiser;
  /**
   * Optional press handler for the Donate button. Wire to your
   * payment flow; the kit doesn't open any payment surface itself.
   */
  onDonatePress?: () => void;
  /**
   * Optional press handler for the transparency-link row. Fires
   * when the viewer taps the "Read the budget" / etc. label; the
   * URL itself is the host's concern.
   */
  onTransparencyPress?: () => void;
};

/**
 * Dataset variant of {@link PostMedia}. Renders a structured dataset
 * tile via {@link "./Dataset".Dataset} -- header eyebrow, name,
 * optional description, a metadata row (rows / columns / license /
 * freshness), and a list of downloadable files. Visual silhouette
 * only: the real download pipeline (file transfers, per-identity
 * quotas, audit logs) lives upstream of this file.
 *
 * Use for council OpenData releases, sensor archives, machine-
 * readable budgets, NGO research dumps -- any post whose payload is
 * "here are some files and a description of what's in them".
 */
export type DatasetMedia = {
  /** Discriminant; selects the dataset shape. */
  kind: "dataset";
  /** Dataset to render. See {@link "./Dataset".PostDataset}. */
  dataset: PostDataset;
  /**
   * Optional press handler invoked with the
   * {@link "./Dataset".PostDatasetDownload.id} of the tapped row.
   * When omitted, rows render as static -- the dataset reads as a
   * record of "what's in it" without a download affordance.
   */
  onDownloadPress?: (downloadId: string) => void;
};

/**
 * Fact-check variant of {@link PostMedia}. Renders a structured
 * fact-check tile via {@link "./FactCheck".FactCheck} -- "Fact-check"
 * eyebrow, the claim being checked in a left-railed quote inset, a
 * verdict badge (one of five tiers -- `true / mostly-true /
 * misleading / false / unverifiable`), an optional editorial summary,
 * an optional list of evidence rows, and an optional checked-at
 * label. Visual silhouette only: the real evaluation pipeline
 * (sourcing, editorial review, audit trail) lives upstream of this
 * file.
 *
 * Use for verdicts published by identified editorial actors --
 * journalists, fact-check desks, civic watchdogs -- not for ad-hoc
 * commentary, which belongs in plain text.
 */
export type FactCheckMedia = {
  /** Discriminant; selects the fact-check shape. */
  kind: "fact-check";
  /** Fact-check to render. See {@link "./FactCheck".PostFactCheck}. */
  factCheck: PostFactCheck;
  /**
   * Optional localised override for the verdict labels. Forwarded
   * verbatim to {@link "./FactCheck".FactCheck}.
   */
  verdictLabels?: Partial<Record<FactCheckVerdict, string>>;
  /**
   * Optional press handler invoked with the
   * {@link "./FactCheck".PostFactCheckEvidence.id} of the tapped
   * evidence row. When omitted, rows render as static -- the
   * fact-check reads as a record of its sources without surfacing
   * a navigation affordance.
   */
  onEvidencePress?: (evidenceId: string) => void;
};

/**
 * Vote-record variant of {@link PostMedia}. Renders a structured
 * roll-call tile via {@link "./VoteRecord".VoteRecord} -- bill /
 * motion reference, optional chamber label, voter capacity, yea /
 * nay / abstain tallies with percentage bars, and an optional
 * press surface for the viewer to record their vote when not yet
 * cast. Visual silhouette only: quorum, eligibility, and ledger
 * persistence live upstream of this file.
 */
export type VoteRecordMedia = {
  /** Discriminant; selects the vote-record shape. */
  kind: "vote-record";
  /** Vote record to render. See {@link "./VoteRecord".PostVoteRecord}. */
  voteRecord: PostVoteRecord;
  /**
   * Optional press handler invoked with the viewer's chosen
   * {@link "./VoteRecord".PostVoteChoice}. Forwarded to
   * {@link "./VoteRecord".VoteRecord}; when omitted, tally rows are
   * read-only.
   */
  onVotePress?: (choice: PostVoteChoice) => void;
};

/**
 * Endorsement variant of {@link PostMedia}. Renders capacity, target kind pill,
 * target label, and statement via {@link "./Endorsement".Endorsement}.
 */
export type EndorsementMedia = {
  kind: "endorsement";
  endorsement: PostEndorsement;
};

/**
 * Commitment variant of {@link PostMedia}. Renders capacity, text, by-date,
 * optional fulfilment via {@link "./Commitment".Commitment}.
 */
export type CommitmentMedia = {
  kind: "commitment";
  commitment: PostCommitment;
};

/**
 * Disclosure variant of {@link PostMedia}. Renders type pill, counterparty,
 * amount, and purpose via {@link "./Disclosure".Disclosure}.
 */
export type DisclosureMedia = {
  kind: "disclosure";
  disclosure: PostDisclosure;
};

/**
 * Discriminated union for the optional {@link PostProps.media} slot. Exactly
 * one variant is set per post -- mirroring every modern social client's
 * "one attachment per post" mental model and keeping the body composition
 * sensible (caption first, then attachment, then quoted post). See
 * {@link LinkMedia}, {@link ImageMedia}, {@link VideoMedia},
 * {@link AudioMedia}, {@link GalleryMedia}, {@link MosaicMedia},
 * {@link CarouselMedia}, {@link PollMedia}, {@link EventMedia},
 * {@link PetitionMedia}, {@link FundraiserMedia},
 * {@link DatasetMedia}, {@link FactCheckMedia},
 * {@link VoteRecordMedia}, {@link EndorsementMedia},
 * {@link CommitmentMedia}, and {@link DisclosureMedia} for the individual shapes.
 */
export type PostMedia =
  | LinkMedia
  | ImageMedia
  | VideoMedia
  | AudioMedia
  | GalleryMedia
  | MosaicMedia
  | CarouselMedia
  | PollMedia
  | EventMedia
  | PetitionMedia
  | FundraiserMedia
  | DatasetMedia
  | FactCheckMedia
  | VoteRecordMedia
  | EndorsementMedia
  | CommitmentMedia
  | DisclosureMedia;

/**
 * Public props for the default-exported {@link Post}.
 */
export type PostProps = {
  /** Author of the post -- forwarded verbatim to the header {@link Profile} row. */
  author: ProfileProps;
  /**
   * Body copy displayed below the header. Wraps across lines. Optional because
   * {@link PostProps.media} (image or gallery) can stand on its own without
   * accompanying text -- omit `content` for image-only and silent-gallery shapes.
   * When both `content` and `media` are absent the body slot is empty but the
   * post still renders its header and footer; pass at least one of the two for
   * any meaningful post.
   *
   * Accepts either a plain string (the common case) or a structured
   * {@link PostContent} array when the post tags users, links URLs,
   * or hashtags inline. In the structured form each entry is a
   * {@link PostTextSegment}, a {@link PostMentionSegment}, a
   * {@link PostUrlSegment}, or a {@link PostHashtagSegment}; the
   * kit renders the array as a single paragraph with mentions,
   * URLs, and hashtags styled as actionable links (when the
   * matching {@link PostProps.onMentionPress} /
   * {@link PostProps.onUrlPress} / {@link PostProps.onHashtagPress}
   * press handler is wired). Empty strings, empty arrays, and
   * `undefined` all collapse to "no body" -- the post still
   * renders its header and footer but the body slot is suppressed.
   */
  content?: PostContent;
  /**
   * Optional attachment slot. Exactly one of {@link PostMedia}'s variants.
   * Rendered immediately below {@link PostProps.content} (or in its place when
   * `content` is omitted) and above any {@link PostProps.relation} inset. Each
   * variant carries its own optional press handler for opening the underlying
   * resource (link, single image, or a specific gallery tile).
   */
  media?: PostMedia;
  /**
   * Optional cross-reference to another post. When set, the original is rendered
   * as a left-railed {@link EmbeddedPostInset} below the outer body, prefixed by
   * a small kind header (icon + label) that names the relationship the outer post
   * has with the embedded one -- "Reposted" when the outer post is sharing it
   * (with optional commentary in {@link PostProps.content}), "Commented" when the
   * outer post is responding to it. Tier 5 extends the {@link PostRelation} union
   * with `quote`, `correction`, and `retraction` variants, each driving its own
   * header chrome on the same inset.
   *
   * Engagement props on the outer {@link Post} (`likeCount`, `liked`, ...) apply
   * to the *outer* post, not the embedded original, matching the way most feeds
   * count engagement for each post independently.
   *
   * Set the embedded post's {@link EmbeddedPostData.onPress} to make the inset
   * pressable -- it renders as a `Pressable` with a subtle scale-down on press,
   * intended for navigating to the original post's detail view.
   *
   * The discriminated-union shape encodes mutual exclusion at the type level:
   * exactly one variant per post, no "what if both are set" precedence rule.
   */
  relation?: PostRelation;
  /**
   * Optional whole-post archetype slot -- the "this post is its own structured
   * shape" axis. When set, the matching archetype teaser replaces the standard
   * {@link PostProps.content} + {@link PostProps.media} body for the feed-row
   * rendering; the full-view component for the archetype lives as a sibling of
   * {@link Post} and is what dedicated routes mount instead. See
   * {@link PostArchetype} for the union.
   *
   * Classification via {@link pickPostType} / {@link usePostType} reads this
   * field first, so an archetype post surfaces as its own `kind` (e.g. `article`)
   * even when legacy `media` is still present on the record.
   */
  archetype?: PostArchetype;
  /**
   * Number of likes shown next to the Like action. The count is hidden
   * when this is `0` or `undefined`, so brand-new posts collapse to a
   * clean icon-only row. When {@link PostProps.liked} is `true`, the
   * displayed count is clamped up to at least `1` -- the viewer's own
   * like contributes one, and a filled red heart with no number beside
   * it would read as an incoherent "I liked this with zero likes"
   * state. Callers can therefore pass `liked: true` without
   * synchronously bumping the count and the kit will paper over the
   * brief inconsistency between the optimistic flag flip and the
   * server-confirmed total.
   */
  likeCount?: number;
  /**
   * Number of comments shown next to the Comment action; hidden on `0` /
   * `undefined`. Orthogonal to {@link PostProps.comments}: the count is the
   * server-side total, the array is whatever subset the caller chose to load
   * for rendering -- they may legitimately differ ("12 comments" with only
   * the first three rendered).
   *
   * When {@link PostProps.commented} is `true`, the displayed count is
   * clamped up to at least `1` -- the viewer's own participation
   * contributes one, so a blue-outlined speech bubble with no number
   * beside it would read as incoherent.
   */
  commentCount?: number;
  /**
   * Number of re-posts shown next to the Re-post action; hidden on `0` /
   * `undefined`. When {@link PostProps.reposted} is `true`, the displayed
   * count is clamped up to at least `1` -- the viewer's own re-post
   * contributes one, so a green-outlined re-post icon with no number
   * beside it would read as incoherent.
   */
  repostCount?: number;
  /**
   * When `true`, the Like action renders in its active treatment: filled red heart icon
   * and matching red count. Mirrors `liked-by-the-current-viewer` semantics; the parent
   * owns the boolean and is expected to flip it from the `onLikePress` handler.
   */
  liked?: boolean;
  /**
   * When `true`, the Comment action renders in its active treatment: blue speech-bubble
   * **outline** (stroke only -- filling it would turn the bubble into a solid blob and
   * lose its shape) and a matching blue count. Use to indicate the viewer has already
   * participated in the thread -- comments aren't a toggle, so this is an informational
   * state.
   */
  commented?: boolean;
  /**
   * When `true`, the Re-post action renders in its active treatment: green-stroked
   * arrows **outline only** (filling them turns the directional shape into a thick blob
   * and the "repost flow" reading is lost) and a matching green count. Same toggle
   * semantics as `liked` -- flip from `onRepostPress`.
   */
  reposted?: boolean;
  /**
   * When `true`, the Bookmark action renders in its active treatment: filled
   * primary bookmark icon. Same toggle semantics as {@link PostProps.liked} --
   * flip from {@link PostProps.onBookmarkPress}.
   * @defaultValue false
   */
  bookmarked?: boolean;
  /**
   * Opts the comment thread into the post body -- a hairline-divided comment
   * thread renders below the action row whenever `showComments` is `true` *and*
   * {@link PostProps.comments} carries at least one entry. The default
   * collapsed shape is the feed-row reading: header + body + action footer, no
   * thread. The opened shape is the post-detail reading: same composition with
   * the thread appended underneath. Mirrors the same opt-in pattern as
   * {@link PostProps.showMenu}, {@link PostProps.showBookmark}, and
   * {@link PostProps.showShare}: secondary
   * surfaces that aren't part of the post's core reading ship hidden so a
   * `Post` in any context that doesn't need them stays tight without the
   * consumer having to actively suppress affordances.
   *
   * Controlled by the parent. The natural wiring is to flip this from
   * {@link PostProps.onCommentPress} so tapping the Comment icon opens the
   * thread; on a dedicated detail view, pass `showComments` set to `true`
   * up-front regardless of {@link PostProps.commented}. The two stay
   * orthogonal -- `commented` is "the viewer has participated",
   * `showComments` is "the thread is open" -- so a viewer who hasn't commented
   * can still open the thread, and a viewer who has commented can leave the
   * thread collapsed.
   * @defaultValue false
   */
  showComments?: boolean;
  /**
   * Comments to render in the opened thread. Ignored when
   * {@link showComments} is `false` (the kit deliberately never renders
   * comments in the collapsed feed row, so passing the array is safe even
   * when the post is currently collapsed). Each entry is a self-contained
   * {@link PostComment} -- see that type for the full per-row contract.
   *
   * The kit takes no opinion on pagination: pass whichever subset the caller
   * has loaded and stitch in "load more" behaviour at the parent level if the
   * thread is large. {@link PostProps.commentCount} stays the server-side
   * total so the action row's counter doesn't drop when the array is
   * truncated.
   */
  comments?: PostComment[];
  /**
   * Opts the kebab overflow menu into the post body. When `false` (default), the
   * floating `IconButton` is omitted entirely. Flip to `true` for the typical "own
   * post" / "moderation actions" affordance and the kebab floats absolutely at the
   * body's top-right corner -- the body itself always uses the post's full inline
   * width, so content flows beneath the small icon rather than wrapping around it.
   * Pair with {@link onMenuPress} to wire up the press.
   * @defaultValue false
   */
  showMenu?: boolean;
  /** Press handler for the overflow (kebab) menu trigger. Only wired when {@link showMenu} is `true`. */
  onMenuPress?: () => void;
  /**
   * Opts the Share footer action into the action row. When `false` (default),
   * the Share `IconButton` is omitted entirely and the right edge of the
   * footer is bare -- the right shape for posts that aren't a sharable
   * surface (composer previews, drafts, embedded references) and the
   * default everywhere because Share is "outbound distribution" rather than
   * core engagement. Flip to `true` for feed rows and detail views where
   * sharing the post out is a first-class action; pair with
   * {@link onSharePress} to wire up the press. Mirrors {@link showMenu}'s
   * opt-in pattern so the two surfaces that aren't part of the post's core
   * reading ship hidden together.
   * @defaultValue false
   */
  showShare?: boolean;
  /**
   * Opts the Bookmark footer action into the action row. When `false` (default),
   * the Bookmark `IconButton` is omitted entirely. Flip to `true` for feed rows
   * and detail views where saving the post is a first-class action; pair with
   * {@link onBookmarkPress} to wire up the press. Mirrors {@link showShare}'s
   * opt-in pattern.
   * @defaultValue false
   */
  showBookmark?: boolean;
  /** Press handler for the Like footer action. */
  onLikePress?: () => void;
  /** Press handler for the Comment footer action. */
  onCommentPress?: () => void;
  /** Press handler for the Re-post footer action. */
  onRepostPress?: () => void;
  /** Press handler for the Share footer action. Only wired when {@link showShare} is `true`. */
  onSharePress?: () => void;
  /** Press handler for the Bookmark footer action. Only wired when {@link showBookmark} is `true`. */
  onBookmarkPress?: () => void;
  /**
   * Press handler fired when an inline mention in {@link PostProps.content}
   * is tapped. Receives the mention's {@link PostMentionSegment.handle}
   * (the bare handle, without the leading `@`); wire to your "open user
   * profile" navigation. When unset, mention segments still render in the
   * kit's link tone but are inert -- they don't carry `accessibilityRole`
   * either, so screen readers announce them as plain copy rather than as
   * a dead link.
   */
  onMentionPress?: (handle: string) => void;
  /**
   * Press handler fired when an inline URL link in
   * {@link PostProps.content} is tapped. Receives the segment's full
   * {@link PostUrlSegment.href} verbatim (scheme intact, never the
   * prettified display form), so consumers can route directly --
   * typically `Linking.openURL(href)` on React Native or
   * `window.open(href, "_blank")` on the web. The kit intentionally
   * does **not** call `Linking.openURL` by default: every other
   * navigation handler on {@link PostProps} is caller-wired, and
   * URLs are no exception. When unset, URL segments still render in
   * the kit's link tone but are inert (no `accessibilityRole`, no
   * tap target), so screen readers announce them as plain copy
   * rather than as a dead link.
   */
  onUrlPress?: (href: string) => void;
  /**
   * Press handler fired when an inline hashtag in
   * {@link PostProps.content} is tapped. Receives the segment's
   * {@link PostHashtagSegment.tag} (the bare tag, without the
   * leading `#`); wire to your "open hashtag feed" navigation
   * (search, filter, topic page, trending detail). The kit does
   * **not** case-fold or otherwise normalise the value before
   * firing -- routing semantics (case-insensitive matching,
   * slugification) are the caller's call. When unset, hashtag
   * segments still render in the kit's link tone but are inert (no
   * `accessibilityRole`, no tap target), so screen readers announce
   * them as plain copy rather than as a dead link.
   */
  onHashtagPress?: (tag: string) => void;
  /**
   * Press handler for the archetype teaser when {@link PostProps.archetype} is
   * set. Forwarded to the matching teaser component; omit for a static teaser.
   */
  onArchetypePress?: () => void;
};

/**
 * Renders a complete social post: profile header, body copy with optional overflow
 * menu, and an action row footer -- all flat on the page background.
 *
 * @param props - {@link PostProps}
 */
export default function Post({
  author,
  content,
  media,
  relation,
  archetype,
  likeCount,
  commentCount,
  repostCount,
  liked = false,
  commented = false,
  reposted = false,
  bookmarked = false,
  showComments = false,
  comments,
  showMenu = false,
  onMenuPress,
  showShare = false,
  showBookmark = false,
  onLikePress,
  onCommentPress,
  onRepostPress,
  onSharePress,
  onBookmarkPress,
  onMentionPress,
  onUrlPress,
  onHashtagPress,
  onArchetypePress,
}: PostProps) {
  const theme = useTheme();
  const resolvedVariant = useMemo(
    () =>
      resolvePostVariant({
        content,
        media,
        archetype,
        linkColor: theme.primary,
        onMentionPress,
        onUrlPress,
        onHashtagPress,
        onArchetypePress,
      }),
    [
      content,
      media,
      archetype,
      theme.primary,
      onMentionPress,
      onUrlPress,
      onHashtagPress,
      onArchetypePress,
    ],
  );
  // Active-state palette pulls straight from the kit-wide accent tokens, so
  // the three action toggles read as a single system colour set across the
  // kit (`danger` for like, `primary` for comment, `success` for repost).
  const likeColor = theme.danger;
  const commentColor = theme.primary;
  const repostColor = theme.success;
  const bookmarkColor = theme.primary;

  // Server-side total feeds the eyebrow's "X COMMENTS" label so the section
  // header stays accurate when `comments` is a paginated subset of the full
  // thread; falls back to the rendered array length when the caller hasn't
  // told us the total separately. `?? 0` covers the `comments === undefined`
  // case so the type narrows cleanly; the showComments gate below stops us
  // from ever rendering the eyebrow with `0`.
  const commentsTotal = commentCount ?? comments?.length ?? 0;
  const commentsLabel = `${commentsTotal} ${
    commentsTotal === 1 ? "COMMENT" : "COMMENTS"
  }`;

  return (
    <View style={styles.container}>
      <Profile {...author} size="sm" inline />

      <View style={styles.body}>
        <View style={styles.bodyColumn}>
          <PostBodyByType resolved={resolvedVariant} />
          {relation ? <EmbeddedPostInset relation={relation} /> : null}
        </View>
        {showMenu ? (
          /*
            Floating wrapper anchors the menu to the top-right of {@link styles.body}.
            With no card around the body, the pill floats directly on the page
            background. The body uses the post's full inline width -- the kebab is
            small (32px) and sits in the top-right corner where the first line's
            opening clause rarely lands, so we let content flow beneath it rather than
            reserving a right gutter that would shrink every line. The `inverted`
            variant gives the pill a solid, theme-matching fill (unlike `ghost`'s
            transparency) so any body text that does wrap into the corner is masked
            behind the button rather than bleeding through the icon.
          */
          <View style={styles.menuButton}>
            <IconButton
              icon={MoreVertical}
              size="sm"
              variant="inverted"
              shape="round"
              onPress={onMenuPress}
              accessibilityLabel={`Post options for ${author.name}`}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionGroup}>
          <PostAction
            icon={Heart}
            count={likeCount}
            active={liked}
            activeColor={likeColor}
            onPress={onLikePress}
            accessibilityLabel={
              liked
                ? `Unlike ${author.name}'s post`
                : `Like ${author.name}'s post`
            }
          />
          <PostAction
            icon={MessageCircle}
            count={commentCount}
            active={commented}
            activeColor={commentColor}
            fillOnActive={false}
            onPress={onCommentPress}
            accessibilityLabel={`Comment on ${author.name}'s post`}
          />
          <PostAction
            icon={Repeat2}
            count={repostCount}
            active={reposted}
            activeColor={repostColor}
            fillOnActive={false}
            onPress={onRepostPress}
            accessibilityLabel={
              reposted
                ? `Remove re-post of ${author.name}'s post`
                : `Re-post ${author.name}'s post`
            }
          />
        </View>
        {showBookmark || showShare ? (
          <View style={styles.actionGroup}>
            {showBookmark ? (
              <PostAction
                icon={Bookmark}
                active={bookmarked}
                activeColor={bookmarkColor}
                onPress={onBookmarkPress}
                accessibilityLabel={
                  bookmarked
                    ? `Remove bookmark from ${author.name}'s post`
                    : `Bookmark ${author.name}'s post`
                }
              />
            ) : null}
            {showShare ? (
              <PostAction
                icon={Share2}
                onPress={onSharePress}
                accessibilityLabel={`Share ${author.name}'s post`}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {showComments && comments && comments.length > 0 ? (
        /*
          Comment thread for the post-detail reading. Gated on both flags so
          passing `comments` without flipping `showComments` is a no-op --
          callers can hand the post the whole thread up-front and let the
          collapsed feed-row stay tight, then toggle `showComments` from
          `onCommentPress` (or on navigation to the detail view) to surface
          the thread. The Card wrapper is the only nested chromeful surface
          inside `Post`; see the file header's Comments bullet for why
          comments earn one while {@link EmbeddedPostInset} stays on a rail.
          The eyebrow is rendered as the Card body's first child rather than
          via its `header` slot so the visible gap to the first comment is
          {@link Typography.Eyebrow}'s natural 12px `marginBottom` -- routing
          it through `Card.header` stacks the slot's own 12px margin on top
          and lands at an airier 24px that reads as two separated zones
          rather than one labelled list.
        */
        <Card>
          <Eyebrow>{commentsLabel}</Eyebrow>
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <PostCommentItem key={comment.id} {...comment} />
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

/**
 * Single row inside the {@link Post}'s comment thread. Composes a
 * dense {@link Profile} header (`xs`, `inline`) over the comment body and a
 * tight Like + Reply action pair built from the same {@link PostAction}
 * primitive the parent post's footer uses -- which means a liked comment
 * picks up the same filled-red Heart as a liked post, just at the same
 * `sm`-button cadence, so engagement reads identically one level down.
 *
 * Reply is rendered unconditionally (no inline composer here; that's a
 * product concern) so every comment carries a predictable accessibility
 * label: a screen reader reading the row announces the author name once via
 * the Profile row, then "Like <author>'s comment" and "Reply to <author>"
 * via the action pair.
 */
function PostCommentItem({
  author,
  content,
  likeCount,
  liked = false,
  onLikePress,
  onReplyPress,
}: PostComment) {
  const theme = useTheme();

  return (
    <View style={styles.comment}>
      <Profile {...author} size="xs" inline />
      <Text style={styles.commentContent}>{content}</Text>
      <View style={styles.commentActions}>
        <PostAction
          icon={Heart}
          count={likeCount}
          active={liked}
          activeColor={theme.danger}
          onPress={onLikePress}
          accessibilityLabel={
            liked
              ? `Unlike ${author.name}'s comment`
              : `Like ${author.name}'s comment`
          }
        />
        <PostAction
          icon={Reply}
          onPress={onReplyPress}
          accessibilityLabel={`Reply to ${author.name}`}
        />
      </View>
    </View>
  );
}

/**
 * Single footer action: a small {@link IconButton} with an optional numeric count rendered
 * inline to its right. The count is omitted when falsy (`0` or `undefined`), so an action
 * with no engagement collapses cleanly to icon-only without an extra "0" sitting beside it.
 *
 * When `active` is `true`, the icon is filled with `activeColor` and the count text picks
 * up the same colour so the toggled state reads consistently. We render the count with
 * React Native's raw `Text` rather than the themed {@link Text} from `Typography` because
 * that helper deliberately wins over caller-supplied colour to enforce theme contrast;
 * here we explicitly want the active colour to take precedence.
 *
 * Kept local to this file because its shape is specific to Post's footer row.
 */
type PostActionProps = {
  /** Lucide icon component rendered inside the underlying {@link IconButton}. */
  icon: LucideIcon;
  /** Screen-reader label forwarded to {@link IconButton} (icon-only buttons need one). */
  accessibilityLabel: string;
  /** Press handler; ignored visually otherwise but kept so the action still feels tappable. */
  onPress?: () => void;
  /**
   * Optional engagement count; rendered to the right of the icon when
   * truthy. When {@link PostActionProps.active} is `true`, the displayed
   * count is clamped up to at least `1` -- the viewer's own engagement
   * contributes one by definition, so a filled-active icon with no
   * number beside it (or a literal `0`) would render an incoherent
   * "I liked this, with zero likes" state. Callers can still pass `0` /
   * `undefined` alongside `active: false` to collapse the row to an
   * icon-only inactive state.
   */
  count?: number;
  /**
   * When `true`, the icon and count switch to {@link PostActionProps.activeColor}. By
   * default the icon is also filled with that colour; pass {@link fillOnActive} = `false`
   * to leave it outline-only. Ignored when `activeColor` is omitted.
   *
   * Drives the "≥ 1" clamp on {@link PostActionProps.count} when a count
   * is present -- see that field for the rationale. Icon-only actions
   * (Bookmark, Share) omit {@link PostActionProps.count} entirely so
   * `active` only recolours / fills the icon.
   * @defaultValue false
   */
  active?: boolean;
  /** Stroke/fill colour applied when `active` is `true`. */
  activeColor?: string;
  /**
   * Controls whether the active state also fills the icon. Default `true` is the right
   * call for solid-silhouette icons like `Heart`, `Star`, `Bookmark` -- where filling
   * reads unambiguously as toggled. Stroke-detailed icons (`MessageCircle`, `Repeat2`,
   * arrows in general) collapse into a coloured blob when filled and lose their shape,
   * so pass `false` for those and let the recoloured outline carry the active state.
   * @defaultValue true
   */
  fillOnActive?: boolean;
};

function PostAction({
  icon,
  accessibilityLabel,
  onPress,
  count,
  active = false,
  activeColor,
  fillOnActive = true,
}: PostActionProps) {
  const theme = useTheme();
  // Mirror the `full-ghost` foreground from `useButtonSurface` so the inactive count text
  // matches the icon next to it without pulling the hook in just to read one colour.
  const tone = active && activeColor ? activeColor : theme.fgEmphasis;

  // The viewer's own engagement counts as at least 1, so any time the
  // action is in its active treatment *and* carries a count we floor the
  // visible total at 1. Without this a liked post with `likeCount: 0`
  // would render as a filled red heart with no number next to it, which
  // reads as "I liked this and nobody else did, but also the count is
  // zero" -- incoherent. When `count` is omitted (Bookmark, Share) the
  // action stays icon-only even when `active` is true.
  const displayedCount =
    count === undefined
      ? undefined
      : active
        ? Math.max(count, 1)
        : count;

  return (
    <View style={styles.action}>
      <IconButton
        icon={icon}
        size="sm"
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        color={active && activeColor ? activeColor : undefined}
        filled={active && fillOnActive}
      />
      {displayedCount ? (
        <RNText style={[styles.count, { color: tone }]}>
          {displayedCount}
        </RNText>
      ) : null}
    </View>
  );
}

/**
 * Per-variant config for the "kind" header above {@link EmbeddedPostInset}'s
 * rail. The icon comes from the same `lucide-react-native` set the action row
 * uses, so a repost-indicator picks up the *same* glyph as the action that
 * produced it ({@link Repeat2}) -- the visual story stays consistent across
 * the kit. Likewise for {@link MessageCircle} on the comment variant.
 *
 * Keyed by {@link PostRelation}'s discriminant verbatim so a new variant on
 * the union is a single new entry here -- adding `quote`, `correction`, and
 * `retraction` (Tier 5) lands as three rows in this table plus three icons
 * imported at the top of the file.
 *
 * Kept as a module-level constant rather than computed inside the component
 * so the component body is the JSX, not a switch ladder.
 */
const EMBEDDED_POST_KIND_META: {
  [K in PostRelation["kind"]]: {
    icon: typeof Repeat2;
    label: string;
  };
} = {
  repost: { icon: Repeat2, label: "Reposted" },
  comment: { icon: MessageCircle, label: "Commented" },
  quote: { icon: Quote, label: "Quoted" },
  correction: { icon: Pencil, label: "Correction" },
  retraction: { icon: Ban, label: "Retracted" },
};

/**
 * Renders the body inside an {@link EmbeddedPostInset}'s rail. Switches on
 * the relation's discriminant so each variant of {@link PostRelation} can
 * pick its own treatment without spreading the per-kind logic across the
 * inset's JSX. Kept private to this file -- it's shape-coupled to the
 * inset and isn't useful in isolation.
 *
 * - {@link RepostRelation} / {@link CommentRelation}: renders the embedded
 *   original through {@link EmbeddedPostRailBody} (full post type when
 *   `media` / `archetype` are set, otherwise commentary text).
 * - {@link QuoteRelation}: replaces the embedded body with the isolated
 *   {@link QuoteRelation.passage}, wrapped in typographic quotation
 *   marks and italicised so the passage reads as a verbatim pull-quote
 *   from the source. The full {@link EmbeddedPostData.content} stays on
 *   the record for navigation but is intentionally not rendered -- the
 *   passage IS the body for a quote.
 * - {@link CorrectionRelation}: renders the embedded original copy
 *   verbatim and appends a "Correction:" labelled note below it with
 *   the {@link CorrectionRelation.note} prose. The label keeps the
 *   correction visually grounded in the original record without
 *   demanding its own header chrome (which the rail-level "Correction"
 *   eyebrow above already supplies).
 * - {@link RetractionRelation}: renders the embedded original copy
 *   with a strikethrough so the "this no longer stands" signal reads
 *   at a glance, then appends a "Retracted:" labelled note below it
 *   with the {@link RetractionRelation.reason} prose. The struck copy
 *   stays the muted foreground colour so the line-through dominates
 *   the reading.
 */
/**
 * Plain-text fallback for relation variants that need a string source
 * ({@link QuoteRelation.passage} context, legacy text-only embeds).
 */
function embeddedPlainText(post: EmbeddedPostData): string {
  const { content } = post;
  if (typeof content === "string") {
    return content;
  }
  if (content) {
    return content
      .map((segment) => {
        switch (segment.kind) {
          case "text":
            return segment.text;
          case "mention":
            return segment.display ?? `@${segment.handle}`;
          case "url":
            return segment.href;
          case "hashtag":
            return `#${segment.tag}`;
        }
      })
      .join("");
  }
  if (post.archetype?.kind === "article") {
    return post.archetype.article.title;
  }
  if (post.archetype?.kind === "liveticker") {
    return post.archetype.liveticker.title;
  }
  if (post.archetype?.kind === "decree") {
    return post.archetype.decree.title;
  }
  if (post.archetype?.kind === "testimony") {
    return post.archetype.testimony.statement;
  }
  return "";
}

function embeddedHasRichBody(post: EmbeddedPostData): boolean {
  return post.media !== undefined || post.archetype !== undefined;
}

type EmbeddedPostRailBodyProps = {
  /** Embedded original body slots. See {@link EmbeddedPostData}. */
  post: EmbeddedPostData;
};

/**
 * Renders an embedded original's body with the same post-TYPE router as the
 * outer {@link Post} row. Kept private to this file -- only
 * {@link EmbeddedPostInset} mounts it inside the left rail.
 */
function EmbeddedPostRailBody({ post }: EmbeddedPostRailBodyProps) {
  const theme = useTheme();
  const resolved = useMemo(
    () =>
      resolvePostVariant({
        content: post.content,
        media: post.media,
        archetype: post.archetype,
        linkColor: theme.primary,
        onArchetypePress: post.onPress,
      }),
    [
      post.archetype,
      post.content,
      post.media,
      post.onPress,
      theme.primary,
    ],
  );

  return (
    <View style={styles.embedBodyColumn}>
      <PostBodyByType resolved={resolved} />
    </View>
  );
}

function renderEmbedRailBody(relation: PostRelation, theme: Theme) {
  switch (relation.kind) {
    case "repost":
    case "comment":
      return <EmbeddedPostRailBody post={relation.post} />;
    case "quote":
      return (
        <Text style={[styles.embedContent, styles.embedQuotePassage]}>
          {`\u201C${relation.passage}\u201D`}
        </Text>
      );
    case "correction":
      return (
        <>
          {embeddedHasRichBody(relation.post) ? (
            <EmbeddedPostRailBody post={relation.post} />
          ) : (
            <Text style={styles.embedContent}>
              {embeddedPlainText(relation.post)}
            </Text>
          )}
          <Text style={[styles.embedNote, { color: theme.fg }]}>
            <RNText
              style={[styles.embedNoteLabel, { color: theme.fgMuted }]}
            >
              Correction:{" "}
            </RNText>
            {relation.note}
          </Text>
        </>
      );
    case "retraction":
      return (
        <>
          {embeddedHasRichBody(relation.post) ? (
            <View style={styles.embedRetractedRich}>
              <EmbeddedPostRailBody post={relation.post} />
            </View>
          ) : (
            <Text
              style={[
                styles.embedContent,
                styles.embedRetractedBody,
                { color: theme.fgMuted },
              ]}
            >
              {embeddedPlainText(relation.post)}
            </Text>
          )}
          <Text style={[styles.embedNote, { color: theme.fg }]}>
            <RNText
              style={[styles.embedNoteLabel, { color: theme.fgMuted }]}
            >
              Retracted:{" "}
            </RNText>
            {relation.reason}
          </Text>
        </>
      );
  }
}

/**
 * Public props for {@link EmbeddedPostInset}. Takes a {@link PostRelation}
 * verbatim -- the relation's discriminant selects the header chrome
 * (icon + label) and the relation's `post` slot supplies the embedded
 * body. Exposed so the {@link "./PostComposer".PostComposer} can reuse
 * the inset for its read-only "this is the post you're referencing"
 * block without re-creating the variant table.
 */
export type EmbeddedPostInsetProps = {
  /** Relation to render. See {@link PostRelation}. */
  relation: PostRelation;
};

/**
 * Left-railed inset that renders the original post a {@link Post} is referencing,
 * with a small kind header (icon + label) above the rail so readers can see at a
 * glance whether the outer post is *reposting* (sharing) or *commenting on*
 * (responding to) the embedded one. Both variants use the same blockquote idiom
 * for the body -- a hairline vertical rail on the left + a left padding -- so we
 * never nest one chromeful surface inside another.
 *
 * Kept private to this file because its visual rules (rail width matched to the
 * outer post's rhythm, tighter font scale, no internal actions) only make sense
 * in this composition. If a second consumer ever appears, this is a candidate
 * to promote to its own module.
 *
 * The kind header sits *above* the rail rather than inside it, because the
 * indicator describes what the *outer* poster is doing (reposting, commenting),
 * not what the embedded author did. Folding it inside the rail would attach the
 * label to the original author's row, which is exactly the wrong story.
 *
 * When {@link EmbeddedPostData.onPress} is set the entire inset (header + rail)
 * becomes a `Pressable` so callers can navigate to the original post's detail
 * view. The press feedback mirrors {@link DisclosureCard} (opacity dip + a
 * subtle scale-down) so tappable embeds feel like the rest of the kit's
 * pressable surfaces. The `accessibilityLabel` is left implicit so React
 * Native composes it from the kind label, the inner {@link Profile} row, and
 * the body text -- same approach as `DisclosureCard`; the embedded author's
 * name is folded into the {@link accessibilityHint} only.
 */
export function EmbeddedPostInset({ relation }: EmbeddedPostInsetProps) {
  const theme = useTheme();
  const { icon: KindIcon, label: kindLabel } =
    EMBEDDED_POST_KIND_META[relation.kind];
  const { author, onPress } = relation.post;

  const header = (
    <View style={styles.embedKind}>
      <KindIcon size={14} color={theme.fgMuted} />
      <RNText style={[styles.embedKindLabel, { color: theme.fgMuted }]}>
        {kindLabel}
      </RNText>
    </View>
  );

  /*
    `inline` collapses the row to one line -- name, flag, and any `from` ride
    together as compact metadata rather than wrapping. `size="xs"` drops the row
    to the densest preset (24px avatar, 13px name, 11px flag), so the inset keeps
    a clearly tighter rhythm than the outer (md) header above it.

    The rail uses the same hairline-border token the {@link Card} surface uses --
    a hairline-thin vertical rule on the side of the rail, so it reads with the
    same weight as every other hairline border in the kit rather than standing
    apart as a heavier "quote bar".

    The rail body switches on the relation's discriminant: repost / comment
    render the embedded body verbatim, quote replaces it with the isolated
    passage wrapped in quotation marks. Tier 5's correction / retraction
    variants will land further switch arms below for their own header
    chrome + body treatment.
  */
  const rail = (
    <View style={[styles.embedRail, { borderLeftColor: theme.borderDefault }]}>
      <Profile {...author} inline size="xs" />
      {renderEmbedRailBody(relation, theme)}
    </View>
  );

  const inner = (
    <>
      {header}
      {rail}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={`Opens ${author.name}'s original post`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.embed,
          webFocusOutlineStyle(),
          pressed && styles.pressableActive,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.embed}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  /**
   * Positioning context for the floating overflow menu *and* the post's root
   * sizing contract. Two invariants live here:
   *
   * 1. `position: 'relative'` is React Native's default for every View, so the
   *    absolutely-positioned {@link IconButton} wrapper anchors against this
   *    container's edges without needing the property set explicitly.
   * 2. `alignSelf: 'stretch'` makes the post fill its parent's inline width
   *    regardless of the parent's `alignItems` setting. Without it, a caller
   *    that wraps the post in `alignItems: 'flex-start'` (e.g. for a centred
   *    column with mixed-width children) would silently get a post that
   *    shrinks to its content. The kit guarantees that every post takes the
   *    full width of whatever container it's dropped into; encoding that as a
   *    style on the root means consumers never have to wrap a post in a
   *    `width: '100%'` View to get the expected behaviour.
   */
  body: {
    alignSelf: "stretch",
  },
  /**
   * Vertical stack for the body copy and the optional {@link EmbeddedPostInset}. Always
   * uses the post's full inline width -- no right-side gutter even when the kebab
   * menu is visible, because the menu floats absolutely (see {@link styles.menuButton})
   * and is small enough that letting content flow beneath it reads better than
   * shrinking every line of the body.
   */
  bodyColumn: {
    flexDirection: "column",
    gap: 10,
  },
  /**
   * Floating overflow-menu wrapper. Anchored top-right of {@link styles.body} so the
   * pill sits at the body's top-right corner, floating on the page background now
   * that the surrounding card is gone.
   */
  menuButton: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  /**
   * Outer wrapper for {@link EmbeddedPostInset}. Stacks the kind header (icon +
   * label) above the rail with an `8px` gap so the indicator sits a hair clear
   * of the original author's profile row without floating away from it. No
   * left padding, no rail of its own -- the indicator deliberately escapes the
   * rail because it describes the *outer* poster's intent, not the embedded
   * author's content.
   */
  embed: {
    flexDirection: "column",
    gap: 8,
  },
  /**
   * "Reposted" / "Commented" kind header row above an {@link EmbeddedPostInset}'s
   * rail. Icon-sized to 14px (a hair smaller than the action-row icons) so the
   * row reads as metadata about the inset rather than as a control. Painted in
   * `theme.fgMuted` inline by {@link EmbeddedPostInset}.
   */
  embedKind: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  /**
   * Label half of the kind header (`"Reposted"` / `"Commented"`). 12/16 keeps
   * the row visually subordinate to the embedded author row below it (which
   * runs at the `xs` Profile preset, 13/16-ish); the medium weight gives the
   * label enough presence to read as a section marker without competing with
   * the embed body. Colour is painted inline by {@link EmbeddedPostInset} from
   * `theme.fgMuted`.
   */
  embedKindLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  /**
   * Rail half of {@link EmbeddedPostInset}. A hairline vertical rail on the
   * left + 12px of left padding gives the embedded original its own visual
   * envelope without nesting one chromeful surface inside another.
   * `borderLeftColor` is themed inline by {@link EmbeddedPostInset} from the
   * kit's hairline-border token.
   */
  embedRail: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    gap: 8,
  },
  /**
   * Pressed-state overlay shared by every `Pressable` inside this file --
   * {@link EmbeddedPostInset}. Mirrors {@link DisclosureCard}'s feedback so
   * tappable surfaces inside a post feel identical to tappable surfaces
   * elsewhere in the kit. Body pressables live in {@link "./PostBody"}.
   */
  pressableActive: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  /**
   * Body-copy style for the embedded post inside {@link EmbeddedPostInset}'s
   * rail. The `14/22` ramp is a hair smaller than the outer post's `15/24` so
   * the embed reads as nested context rather than competing with the outer
   * body. {@link PostComment} uses the same ramp on purpose -- comments earn
   * a Profile header, embeds stay on a rail.
   */
  embedContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  /**
   * Stacks {@link PostBodyByType} beneath the xs {@link Profile} row inside
   * an embed rail. `gap` matches the outer post body rhythm at a slightly
   * tighter scale so tiles read as nested context.
   */
  embedBodyColumn: {
    gap: 8,
    alignSelf: "stretch",
  },
  /**
   * Mutes a rich embed body inside a {@link RetractionRelation} when the
   * original carried media or an archetype teaser (strikethrough on tiles
   * would fight the structured chrome).
   */
  embedRetractedRich: {
    opacity: 0.72,
  },
  /**
   * Passage treatment for a {@link QuoteRelation}'s rail body. Italic +
   * surrounding curly quotation marks so the span reads as a verbatim
   * pull-quote rather than as the embedded author's own copy. Layered on
   * top of {@link styles.embedContent} so the size / line-height of every
   * inset body stays uniform regardless of kind.
   */
  embedQuotePassage: {
    fontStyle: "italic",
  },
  /**
   * Strikethrough treatment for a {@link RetractionRelation}'s rail
   * body. Layered on top of {@link styles.embedContent} so the size /
   * line-height stays uniform; colour is painted inline (muted
   * foreground) by the rail-body renderer because tying the muted
   * tone to the strikethrough at the same layer keeps the "this no
   * longer stands" reading legible without needing a separate
   * background fill behind the run.
   */
  embedRetractedBody: {
    textDecorationLine: "line-through",
  },
  /**
   * Extra line appended below the embedded original inside a
   * {@link CorrectionRelation} / {@link RetractionRelation}'s rail.
   * Shares the embedded body's `14/22` ramp so the addition reads as a
   * continuation of the inset rather than as a separate surface; the
   * `marginTop` opens a 6px gap so the prefix label is unambiguously
   * a second paragraph. Colour is painted inline (foreground for the
   * note body, muted foreground for the inline {@link embedNoteLabel}
   * prefix) so the same row can carry both tones without splitting
   * into two `Text` nodes at the call site.
   */
  embedNote: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  /**
   * Inline label prefix on {@link styles.embedNote}'s line ("Correction:",
   * "Retracted:"). Bolder weight + muted colour separates the prefix
   * tonally from the note body without making the row read as two
   * disjoint blocks; the prefix sits inside the same `<Text>` as the
   * body via React Native's nested-text inline composition so the line
   * still wraps as a single paragraph.
   */
  embedNoteLabel: {
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    // The three engagement actions sit in `actionGroup` on the left and bookmark /
    // share share a second `actionGroup` on the right, so `space-between` cleanly
    // pushes that cluster to the trailing edge with all the remaining width as
    // breathing room in between.
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    // Matches the 12px rhythm used by `container` and `Profile.row` so the left
    // cluster reads as "one composed block" rather than three loose icons.
    gap: 12,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "500",
    // `IconButton` size `sm` has 8px of internal right-padding around the 16px icon. The
    // negative marginLeft pulls the count back into that padding so the visible gap
    // between the icon glyph and the number lands at ~4px instead of the ~12px we'd get
    // with a flex `gap`.
    marginLeft: -4,
  },
  /**
   * Vertical list of comment rows inside the comments Card. All surface
   * chrome (border, fill, padding) lives on the {@link Card} wrapper itself
   * and on the {@link Eyebrow} above this list, so this style only carries
   * the inter-row rhythm: `gap: 16` is a touch looser than the 12px rhythm
   * elsewhere in the post, so distinct comments read as their own sub-rows
   * rather than rows of one continuous block -- matching the cadence
   * Twitter / Mastodon use in their comment threads.
   */
  commentsList: {
    gap: 16,
  },
  /**
   * Per-comment block. The Profile row is followed by the body and the
   * action pair, all stacked left-flush at the post's full inline width.
   * 6px gap (matching the `xs` Profile preset's row gap) keeps the three
   * elements visually attached to each other so each comment reads as
   * "one chunk" against the 16px gap between comments.
   */
  comment: {
    gap: 6,
  },
  /**
   * Comment body copy. Same `14/22` ramp as {@link styles.embedContent}
   * because comments and quoted-post insets share the same "nested, denser"
   * context against the outer `15/24` body -- using the same ramp twice
   * keeps the kit's two nested-text contexts in sync.
   */
  commentContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  /**
   * Action pair (Like + Reply) for a single comment. 12px gap matches the
   * outer {@link styles.actionGroup} so the two action-row paces feel
   * related; left-flush alignment keeps the actions under the comment body
   * (rather than indented under the avatar) so longer threads don't drift
   * progressively to the right as comments accumulate.
   */
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
