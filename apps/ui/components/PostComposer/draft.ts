/**
 * Pure data model + helpers for the {@link "./PostComposer".PostComposer}.
 * Lives in its own module so the in-flight composer state (a
 * {@link PostDraft}) is a plain serialisable record that can be unit
 * tested in Node without dragging React Native into the picture --
 * mirrors the split between {@link "../Button/resolve-surface"}
 * (pure variant table) and {@link "../Button/surface"} (the React hook
 * shell on top of it).
 *
 * The draft is the input contract callers hand to the composer; the
 * helpers ({@link withContent}, {@link withMedia}, ...) are pure
 * setters that return a new draft so callers can plug them straight
 * into a `useState`-driven controlled flow without reaching for an
 * immutability library. {@link draftToPostProps} adapts a draft into
 * the {@link PostProps} shape that the existing {@link "../Post".Post}
 * renderer consumes, so a screen wanting a live preview just renders
 * `<Post {...draftToPostProps(draft, author)} />`.
 */
import type {
  PostArchetype,
  PostImage,
  PostMedia,
  PostProps,
  PostRelation,
} from "../Post";
import type { PostCommitment } from "../Post/Commitment";
import type { PostDataset } from "../Post/Dataset";
import type { PostDisclosure } from "../Post/Disclosure";
import type { PostEndorsement } from "../Post/Endorsement";
import type { PostEvent } from "../Post/Event";
import type { PostFactCheck } from "../Post/FactCheck";
import type { PostFundraiser } from "../Post/Fundraiser";
import type { PostPetition } from "../Post/Petition";
import type { PostPoll } from "../Post/Poll";
import type { ProfileProps } from "../Profile";
import type { PostVoteRecord } from "../Post/VoteRecord";

/**
 * In-flight state of a post being composed. Carries the same content
 * dimensions a finished post does -- body copy plus an optional
 * attachment plus an optional cross-reference to another post -- but
 * never carries the engagement / action / overflow props a rendered
 * {@link Post} accepts (a draft has no likes, no menu, no share). Treat
 * it as the "edit-time" shape; pair with {@link draftToPostProps} to
 * project it into the "render-time" shape.
 *
 * When {@link PostDraft.archetype} is set, it replaces the standard body
 * for preview and submit projection the same way {@link PostProps.archetype}
 * does on the rendered post: {@link draftToPostProps} clears {@link PostProps.content}
 * and {@link PostProps.media} so the feed row shows only the archetype teaser.
 */
export type PostDraft = {
  /**
   * Body copy. Always present (the draft can be submittable with an
   * empty string only when {@link PostDraft.media} or
   * {@link PostDraft.relation} is set). Held as a plain string --
   * structured {@link PostContent} rendering with mentions is a
   * follow-up; for v1 the composer just forwards the raw text and
   * `Post` handles the autolinker / mention resolution at render time.
   */
  content: string;
  /**
   * Optional staged attachment. Exactly one of the {@link PostMedia}
   * shapes; mirrors the same discriminated union the rendered post
   * consumes so the composer's preview is a 1:1 projection of the
   * eventual post.
   */
  media?: PostMedia;
  /**
   * Optional cross-reference to another post -- the draft is *resharing*
   * (kind `"repost"`), *responding to* (kind `"comment"`), or otherwise
   * referencing an existing post. Set when the composer was opened from
   * a "Repost" / "Comment" / ... intent on an existing post; the
   * embedded post is read-only inside the composer and the user's
   * commentary lives in {@link PostDraft.content}.
   *
   * The discriminated-union shape encodes mutual exclusion at the type
   * level: exactly one relation per draft. Use {@link withRelation} to
   * swap between variants -- it just overwrites the slot, no precedence
   * rule needed.
   */
  relation?: PostRelation;
  /**
   * Optional whole-post archetype (decree, testimony, article, ...).
   * Mutually exclusive with {@link PostDraft.media} in the helpers: staging
   * media clears archetype and vice versa.
   * @defaultValue undefined
   */
  archetype?: PostArchetype;
};

/**
 * Returns a fresh empty draft. Used as the seed for an uncontrolled
 * composer flow (`const [draft, setDraft] = useState(emptyDraft())`).
 * Always allocates a new object so callers don't accidentally share a
 * reference across composers.
 */
export function emptyDraft(): PostDraft {
  return { content: "" };
}

/**
 * Returns a new draft with {@link PostDraft.media} set and any staged
 * {@link PostDraft.archetype} cleared. Internal helper so every media
 * staging path stays mutually exclusive with archetypes.
 */
function withMediaStaged(draft: PostDraft, media: PostMedia): PostDraft {
  return { ...draft, media, archetype: undefined };
}

/**
 * Returns a new draft with `content` replaced. Pure -- the input draft is
 * not mutated. Pass through `setDraft(withContent(draft, next))` from a
 * {@link "../Input".TextArea}'s `onChangeText`.
 */
export function withContent(draft: PostDraft, content: string): PostDraft {
  return { ...draft, content };
}

/**
 * Returns a new draft with `media` set. Replaces any existing
 * attachment; pair with {@link clearMedia} to drop the slot back to
 * undefined. The new attachment can be any {@link PostMedia} shape --
 * link, image, video, audio, gallery, mosaic, or carousel.
 */
export function withMedia(draft: PostDraft, media: PostMedia): PostDraft {
  return withMediaStaged(draft, media);
}

/**
 * Returns a new draft with the {@link PostDraft.media} slot cleared.
 * Pure: leaves every other field untouched. Use from the staged-media
 * preview's "remove" affordance.
 */
export function clearMedia(draft: PostDraft): PostDraft {
  const { media: _media, ...rest } = draft;
  return rest;
}

/**
 * Appends `pictures` to the draft's staged photo selection, promoting
 * and demoting between `image` and `gallery` automatically so the
 * data model always matches the photo count. Designed as the
 * single-call adapter for the composer's unified "pick pictures"
 * affordance: whatever the host's picker returns, hand it to this
 * helper and the draft's media slot ends up in the right shape.
 *
 * Behavioural contract:
 *
 * - Empty input -- the draft is returned unchanged.
 * - No existing media, or existing media is a `link` / `video` /
 *   `audio` / `mosaic` / `carousel` -- `pictures` *replaces* the
 *   slot. (Mosaic and carousel are explicit layout choices, not
 *   photo selections; if the user picks new pictures they're
 *   starting a fresh photo attachment. A staged video or audio is
 *   similarly replaced wholesale -- the unified picker doesn't
 *   currently mix photo and video/audio selections in one staged
 *   attachment.)
 * - Existing media is `image` or `gallery` -- `pictures` is
 *   *appended* to the existing photos. The combined list is then
 *   capped at `max` (defaults to `4`, matching the rendered post's
 *   gallery cap).
 * - Final shape: 1 photo stages as {@link "../Post".ImageMedia},
 *   2 or more photos stage as {@link "../Post".GalleryMedia}. The
 *   transition is automatic so callers never have to pick the kind
 *   themselves.
 *
 * Pure: returns a new draft without mutating the input.
 */
export function addPictures(
  draft: PostDraft,
  pictures: PostImage[],
  max = 4,
): PostDraft {
  if (pictures.length === 0) return draft;

  const existing = draft.media;
  let combined: PostImage[];

  if (existing?.kind === "image") {
    combined = [existing.image, ...pictures];
  } else if (existing?.kind === "gallery") {
    combined = [...existing.images, ...pictures];
  } else {
    combined = [...pictures];
  }

  combined = combined.slice(0, max);

  if (combined.length === 1) {
    return { ...draft, archetype: undefined, media: { kind: "image", image: combined[0] } };
  }
  return { ...draft, archetype: undefined, media: { kind: "gallery", images: combined } };
}

/**
 * Returns a new draft with the image at `index` dropped from a
 * multi-image staged attachment. Routes by media kind so callers can
 * wire every per-image remove affordance through this single helper
 * without branching at the call site:
 *
 * - `gallery` -- drop the image at `index`. Three transitions: 3+ →
 *   stays `gallery` with one fewer image; 2 → 1 *demotes* to `image`
 *   (the single-photo data shape matches the single-photo render); 1
 *   → clears the {@link PostDraft.media} slot entirely. The demotion
 *   mirrors {@link addPictures}'s automatic promotion: the kind
 *   always tracks the photo count, so the composer never holds a
 *   one-photo "gallery".
 * - `mosaic` / `carousel` -- drop the image at `index` from `images`.
 *   The kind is preserved at any count `>= 1` (mosaic/carousel are
 *   explicit layout choices and don't demote to `image` -- the user
 *   curated a mosaic/carousel and removing one tile doesn't change
 *   that intent). Empty `images` clears the slot.
 * - `image` / `video` / `audio` -- equivalent to {@link clearMedia}
 *   (there is exactly one tile to remove); `index` is ignored. Video
 *   and audio use the same single-tile remove semantics as image
 *   because both mock shapes are also single-attachment -- a future
 *   "video gallery" or "audio playlist" would diverge from this
 *   branch with its own per-index handling.
 * - `poll` / `event` / `petition` / `fundraiser` / `dataset` /
 *   `fact-check` / `vote-record` / `endorsement` / `commitment` /
 *   `disclosure` -- not
 *   applicable; each is a single structured tile (or a list of
 *   non-image rows, in the dataset case), not a list of images. The
 *   draft is returned unchanged so callers can route every per-image
 *   remove through this helper regardless of the current media shape;
 *   pair with {@link clearMedia} when the user wants to drop the
 *   staged tile entirely.
 * - `link` -- not applicable; the draft is returned unchanged so
 *   callers can route every per-image remove through this helper
 *   regardless of the current media shape.
 * - no media -- returned unchanged.
 *
 * Out-of-bounds `index` values leave the draft unchanged, so a stale
 * tap that races a previous removal is a no-op rather than a throw.
 */
export function removeMediaImage(
  draft: PostDraft,
  index: number,
): PostDraft {
  const media = draft.media;
  if (!media) return draft;
  switch (media.kind) {
    case "link":
      return draft;
    case "image":
      return clearMedia(draft);
    case "video":
      return clearMedia(draft);
    case "audio":
      return clearMedia(draft);
    case "gallery": {
      if (index < 0 || index >= media.images.length) return draft;
      const next = media.images.filter((_, i) => i !== index);
      if (next.length === 0) return clearMedia(draft);
      if (next.length === 1) {
        return { ...draft, media: { kind: "image", image: next[0] } };
      }
      return { ...draft, media: { ...media, images: next } };
    }
    case "mosaic": {
      if (index < 0 || index >= media.images.length) return draft;
      const next = media.images.filter((_, i) => i !== index);
      if (next.length === 0) return clearMedia(draft);
      return { ...draft, media: { ...media, images: next } };
    }
    case "carousel": {
      if (index < 0 || index >= media.images.length) return draft;
      const next = media.images.filter((_, i) => i !== index);
      if (next.length === 0) return clearMedia(draft);
      return { ...draft, media: { ...media, images: next } };
    }
    case "poll":
      return draft;
    case "event":
      return draft;
    case "petition":
      return draft;
    case "fundraiser":
      return draft;
    case "dataset":
      return draft;
    case "fact-check":
      return draft;
    case "vote-record":
      return draft;
    case "endorsement":
      return draft;
    case "commitment":
      return draft;
    case "disclosure":
      return draft;
  }
}

/**
 * Returns a new draft with a `poll` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a poll" affordance -- the host's poll-configuration drawer
 * gathers the {@link "../Poll".PostPoll} fields and hands the result
 * to this helper. Pure: returns a new draft without mutating the
 * input.
 *
 * Replaces any previously-staged media (same precedent every other
 * attachment helper follows); pair with {@link clearMedia} to drop the
 * poll back to undefined.
 */
export function withPoll(draft: PostDraft, poll: PostPoll): PostDraft {
  return withMediaStaged(draft, { kind: "poll", poll });
}

/**
 * Returns a new draft with an `event` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach an event" affordance -- the host's event-configuration
 * drawer gathers the {@link "../Event".PostEvent} fields and hands
 * the result to this helper. Pure: returns a new draft without
 * mutating the input.
 *
 * Replaces any previously-staged media (same precedent every other
 * attachment helper follows); pair with {@link clearMedia} to drop
 * the event back to undefined.
 */
export function withEvent(draft: PostDraft, event: PostEvent): PostDraft {
  return withMediaStaged(draft, { kind: "event", event });
}

/**
 * Returns a new draft with a `petition` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a petition" affordance; the host's petition-configuration
 * drawer gathers the {@link "../Petition".PostPetition} fields and
 * hands the result to this helper. Pure: returns a new draft
 * without mutating the input.
 */
export function withPetition(
  draft: PostDraft,
  petition: PostPetition,
): PostDraft {
  return withMediaStaged(draft, { kind: "petition", petition });
}

/**
 * Returns a new draft with a `fundraiser` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a fundraiser" affordance. Pure: returns a new draft
 * without mutating the input.
 */
export function withFundraiser(
  draft: PostDraft,
  fundraiser: PostFundraiser,
): PostDraft {
  return withMediaStaged(draft, { kind: "fundraiser", fundraiser });
}

/**
 * Returns a new draft with a `dataset` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a dataset" affordance. Pure: returns a new draft without
 * mutating the input.
 */
export function withDataset(
  draft: PostDraft,
  dataset: PostDataset,
): PostDraft {
  return withMediaStaged(draft, { kind: "dataset", dataset });
}

/**
 * Returns a new draft with a `fact-check` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a fact-check" affordance. Pure: returns a new draft
 * without mutating the input.
 */
export function withFactCheck(
  draft: PostDraft,
  factCheck: PostFactCheck,
): PostDraft {
  return withMediaStaged(draft, { kind: "fact-check", factCheck });
}

/**
 * Returns a new draft with a `vote-record` attachment staged on
 * {@link PostDraft.media}. Single-call adapter for the composer's
 * "attach a vote record" affordance. Pure: returns a new draft
 * without mutating the input.
 */
export function withVoteRecord(
  draft: PostDraft,
  voteRecord: PostVoteRecord,
): PostDraft {
  return withMediaStaged(draft, { kind: "vote-record", voteRecord });
}

/**
 * Returns a new draft with an `endorsement` attachment staged on
 * {@link PostDraft.media}.
 */
export function withEndorsement(
  draft: PostDraft,
  endorsement: PostEndorsement,
): PostDraft {
  return withMediaStaged(draft, { kind: "endorsement", endorsement });
}

/**
 * Returns a new draft with a `commitment` attachment staged on
 * {@link PostDraft.media}.
 */
export function withCommitment(
  draft: PostDraft,
  commitment: PostCommitment,
): PostDraft {
  return withMediaStaged(draft, { kind: "commitment", commitment });
}

/**
 * Returns a new draft with a `disclosure` attachment staged on
 * {@link PostDraft.media}.
 */
export function withDisclosure(
  draft: PostDraft,
  disclosure: PostDisclosure,
): PostDraft {
  return withMediaStaged(draft, { kind: "disclosure", disclosure });
}

/**
 * Returns a new draft with {@link PostDraft.archetype} set and {@link PostDraft.media}
 * cleared so the edit-time model mirrors {@link PostProps} (archetype wins over media
 * on the rendered post).
 */
export function withArchetype(
  draft: PostDraft,
  archetype: PostArchetype,
): PostDraft {
  return { ...draft, archetype, media: undefined };
}

/**
 * Drops {@link PostDraft.archetype} while leaving content, media, and relation untouched.
 */
export function clearArchetype(draft: PostDraft): PostDraft {
  const { archetype: _archetype, ...rest } = draft;
  return rest;
}

/**
 * Returns a new draft with the {@link PostDraft.relation} slot set to
 * `relation`. Overwrites any previously-staged relation -- the
 * discriminated-union shape means exactly one variant lives at a time, so
 * staging a `"comment"` relation on a draft that was previously a
 * `"repost"` simply replaces it (no precedence rule, no separate clear
 * step). Pair with {@link clearRelation} to drop the slot back to
 * `undefined`.
 */
export function withRelation(
  draft: PostDraft,
  relation: PostRelation,
): PostDraft {
  return { ...draft, relation };
}

/**
 * Returns a new draft with the {@link PostDraft.relation} slot cleared.
 * Use when the user dismisses a repost / comment / quote / correction /
 * retraction intent and wants to keep typing on the standalone-post
 * draft they already started.
 */
export function clearRelation(draft: PostDraft): PostDraft {
  const { relation: _relation, ...rest } = draft;
  return rest;
}

/**
 * Returns `true` when the draft carries enough content to be worth
 * submitting -- the same rule the composer's submit button consults
 * before flipping itself enabled.
 *
 * A draft is submittable when **any** of the following is true:
 *
 * - {@link PostDraft.content} has at least one non-whitespace character.
 * - {@link PostDraft.media} is set.
 * - {@link PostDraft.relation} is set (a bare "repost without
 *   commentary" is a valid post; same for a bare reply without text
 *   when the embedded original carries the context, and for every
 *   other relation variant the union grows in later tiers).
 * - {@link PostDraft.archetype} is set (decree, testimony, article, ...).
 *
 * Pure: returns the boolean without modifying the input. Exported as a
 * named helper rather than inlined into the component so tests can lock
 * the rule down independently.
 */
export function isSubmittable(draft: PostDraft): boolean {
  if (draft.content.trim() !== "") return true;
  if (draft.media !== undefined) return true;
  if (draft.relation !== undefined) return true;
  if (draft.archetype !== undefined) return true;
  return false;
}

/**
 * Projects a {@link PostDraft} into the {@link PostProps} shape consumed
 * by the rendered {@link "../Post".Post}. Used by the composer's live
 * preview block to render `<Post {...draftToPostProps(draft, author)} />`
 * -- a thin adapter so the composer's edit-time state is always one
 * step away from the read-time view, with no parallel rendering path.
 *
 * The projection deliberately omits every engagement / action / overflow
 * prop (`likeCount`, `commentCount`, `showShare`, `showMenu`, ...) -- a
 * draft has no engagement and no actions, so the preview always reads as
 * the cleanest possible feed-row shape.
 *
 * @param draft - {@link PostDraft} to project.
 * @param author - Identity row to show as the post's author. Threaded in
 *   from the caller because the draft itself never carries an author --
 *   the composer always renders the *current viewer* as the author.
 */
export function draftToPostProps(
  draft: PostDraft,
  author: ProfileProps,
): PostProps {
  const archetype = draft.archetype;
  return {
    author,
    content: archetype !== undefined ? "" : draft.content,
    media: archetype !== undefined ? undefined : draft.media,
    relation: draft.relation,
    ...(archetype !== undefined ? { archetype } : {}),
  };
}
