/**
 * Pure classifier for the shape of a {@link Post}. Given the body-driving
 * props ({@link PostProps.content}, {@link PostProps.media}, and optional
 * {@link PostProps.archetype}), produces the one-of-twenty-two identity that
 * drives how the post body lays out:
 *
 * 1. `text`         -- just commentary, or nothing at all (the degenerate
 *                       "no content, no media" post also falls here).
 * 2. `text-url`     -- an OpenGraph link preview (with or without
 *                       commentary). Carries the resolved `url` so
 *                       consumers can route on it without re-walking the
 *                       full {@link LinkPreview}.
 * 3. `image`        -- a single rounded photo.
 * 4. `video`        -- a single mock video tile (a poster photo with a
 *                       centered play-button overlay). Surfaces the
 *                       `kind: "video"` shape today while the kit's
 *                       playback pipeline is still upstream of this
 *                       file -- see {@link "./Media".Video}.
 * 5. `audio`        -- a single mock audio pill (a hairline-bordered
 *                       row with a primary play button + a static
 *                       waveform + an optional duration). Same
 *                       "ship the silhouette while the playback
 *                       pipeline catches up" pattern `video` uses --
 *                       see {@link "./Media".Audio}.
 * 6. `gallery`      -- the Twitter-style 1-4 tile grid.
 * 7. `mosaic`       -- the vertical stack of differently-shaped photos.
 * 8. `carousel`     -- the swipeable single-tile-at-a-time strip of
 *                       uniformly-shaped photos.
 * 9. `poll`         -- a structured ballot tile (question + options +
 *                       running tally + optional deadline). Visual
 *                       silhouette only -- the real ballot pipeline
 *                       lives upstream of the kit, same pattern as
 *                       `video` / `audio`. See {@link "./Poll".Poll}.
 * 10. `event`       -- a structured event-card tile (date stack,
 *                       title, time range, place, format, RSVP
 *                       count + optional "RSVP" / "Going"
 *                       affordance). Visual silhouette only -- the
 *                       real RSVP pipeline lives upstream of the
 *                       kit, same precedent. See
 *                       {@link "./Event".Event}.
 * 11. `petition`    -- a structured petition tile (title, ask,
 *                       optional progress bar, signature tally,
 *                       optional deadline, and optional "Sign" /
 *                       "Signed" affordance). Visual silhouette only
 *                       -- the real signature pipeline lives
 *                       upstream of the kit. See
 *                       {@link "./Petition".Petition}.
 * 12. `fundraiser`  -- a structured fundraiser tile (title, pitch,
 *                       money-progress bar, currency-typed raised /
 *                       goal, optional deadline, optional Donate
 *                       affordance, optional transparency-link
 *                       row). Visual silhouette only -- the real
 *                       payment pipeline lives upstream of the kit.
 *                       See {@link "./Fundraiser".Fundraiser}.
 * 13. `dataset`     -- a structured dataset tile (name, description,
 *                       row / column / license / freshness
 *                       metadata, downloadable file rows). Visual
 *                       silhouette only -- the real download pipeline
 *                       lives upstream. See
 *                       {@link "./Dataset".Dataset}.
 * 14. `fact-check`  -- a structured fact-check tile (claim in a quote
 *                       rail, verdict badge, optional summary,
 *                       evidence rows). Visual silhouette only --
 *                       the real verification pipeline lives upstream.
 *                       See {@link "./FactCheck".FactCheck}.
 * 15. `vote-record` -- a structured roll-call tile (bill reference,
 *                       voter capacity, yea / nay / abstain tallies,
 *                       optional viewer vote). Visual silhouette only
 *                       -- quorum and ledger persistence live upstream.
 *                       See {@link "./VoteRecord".VoteRecord}.
 * 16. `article`      -- an editorial {@link PostProps.archetype} with
 *                       `kind: "article"` whose feed row uses
 *                       {@link "./Article".ArticleTeaser} and whose detail
 *                       view uses {@link "./Article".default}. CMS and paywall
 *                       live upstream.
 * 17. `liveticker`    -- an append-only {@link PostProps.archetype} with
 *                       `kind: "liveticker"` whose feed row uses
 *                       {@link "./Liveticker".LivetickerTeaser} and whose detail
 *                       view uses {@link "./Liveticker".default}. Real-time
 *                       delivery and moderation live upstream.
 * 18. `endorsement`   -- a structured endorsement tile (capacity, target
 *                       kind + label, statement). See
 *                       {@link "./Endorsement".Endorsement}.
 * 19. `commitment`    -- a structured commitment tile (capacity, text,
 *                       by-date, optional fulfilment). See
 *                       {@link "./Commitment".Commitment}.
 * 20. `disclosure`    -- a structured transparency disclosure (type pill,
 *                       counterparty, amount, purpose). See
 *                       {@link "./Disclosure".Disclosure}.
 * 21. `decree`        -- an issued {@link PostProps.archetype} with
 *                       `kind: "decree"` whose feed row uses
 *                       {@link "./Decree".DecreeTeaser} and whose detail view
 *                       uses {@link "./Decree".default}. Gazette systems live upstream.
 * 22. `testimony`     -- a witness {@link PostProps.archetype} with
 *                       `kind: "testimony"` whose feed row uses
 *                       {@link "./Testimony".TestimonyTeaser} and whose detail view
 *                       uses {@link "./Testimony".default}.
 *
 * The classification is structural, not aspirational: it reads what's
 * actually present on the post props and never tries to infer "should
 * have been a gallery but only one image was passed". When
 * {@link PostProps.archetype} is set, it wins over {@link PostProps.media}
 * for the returned `kind`. Otherwise the {@link PostMedia} discriminant is
 * the source of truth for attachment-backed shapes, and the classifier's job
 * is additionally to:
 *
 * - hoist the "no media at all" case to a first-class kind (`text`)
 *   so consumers don't have to special-case the absent-`media` branch,
 *   and
 * - surface the link's URL alongside the kind so the common "where does
 *   this post point at?" question can be answered without poking through
 *   the `LinkMedia.preview` payload.
 *
 * Kept framework-free (no React, no React Native) so it can be unit-tested
 * in Node and reused outside a render tree (analytics, server-side feed
 * routing, etc.). The stateful shell that wraps it for React consumers
 * lives in {@link "./use-post-type"}; pure code that already has the
 * inputs in hand can read this module directly.
 *
 * @example
 * ```ts
 * pickPostType({ content: "hi" });
 * // => { kind: "text" }
 *
 * pickPostType({
 *   media: { kind: "link", preview: { url: "https://x.test/a", title: "...", domain: "x.test" } },
 * });
 * // => { kind: "text-url", url: "https://x.test/a" }
 * ```
 */
import type { PostProps } from "./Post";

/**
 * Discriminated union returned by {@link pickPostType}. The `kind` matches
 * the twenty post shapes the body can render; only `text-url` carries any
 * additional data (the resolved {@link LinkPreview.url} for the previewed
 * link, hoisted to the top level so routing/analytics code doesn't have to
 * reach back into the media object).
 */
export type PostType =
  | {
      /** Plain-text post: just {@link PostProps.content}, or nothing at all. */
      kind: "text";
    }
  | {
      /**
       * Link-preview post: an OpenGraph embed, optionally accompanied by
       * commentary in {@link PostProps.content}. The post is classified as
       * `text-url` even when `content` is absent -- the URL is the
       * defining feature.
       */
      kind: "text-url";
      /**
       * Canonical URL of the previewed page, lifted verbatim from
       * {@link LinkMedia.preview}'s `url` field. Mirrors what
       * `Linking.openURL` / `window.open` expects.
       */
      url: string;
    }
  | {
      /** Single-photo post. See {@link ImageMedia}. */
      kind: "image";
    }
  | {
      /**
       * Single-video post: a mock video tile (poster photo + centered
       * play-button overlay) rendered today by
       * {@link "./Media".Video}, with a real player slotting in
       * underneath once the kit's playback pipeline is ready. See
       * {@link VideoMedia}.
       */
      kind: "video";
    }
  | {
      /**
       * Single-audio post: a mock audio pill (primary play button +
       * static waveform + optional duration) rendered today by
       * {@link "./Media".Audio}, with a real player slotting in
       * underneath once the kit's playback pipeline is ready. See
       * {@link AudioMedia}.
       */
      kind: "audio";
    }
  | {
      /** Twitter-style 1-4 tile grid. See {@link GalleryMedia}. */
      kind: "gallery";
    }
  | {
      /** Vertical stack of differently-shaped photos. See {@link MosaicMedia}. */
      kind: "mosaic";
    }
  | {
      /**
       * Swipeable single-tile-at-a-time strip of uniformly-shaped photos.
       * See {@link CarouselMedia}.
       */
      kind: "carousel";
    }
  | {
      /**
       * Structured poll tile: question + options + running tally +
       * optional deadline. Rendered today by {@link "./Poll".Poll};
       * the real ballot pipeline (option-selection persistence,
       * deduplication, deadline enforcement, public-tally aggregation)
       * lives upstream of the kit, same precedent as
       * {@link "./Media".Video} / {@link "./Media".Audio}. See
       * {@link PollMedia}.
       */
      kind: "poll";
    }
  | {
      /**
       * Structured event-card tile: date stack, title, time range,
       * place, online / in-person flag, RSVP count, and an optional
       * RSVP affordance. Rendered today by {@link "./Event".Event};
       * the real RSVP pipeline (one-RSVP-per-identity, capacity,
       * deadline enforcement, calendar exports) lives upstream of
       * the kit, same precedent the other structured tiles follow.
       * See {@link EventMedia}.
       */
      kind: "event";
    }
  | {
      /**
       * Structured petition tile: title, ask paragraph, optional
       * progress bar against a goal, signature tally, optional
       * deadline label, and optional Sign affordance. Rendered today
       * by {@link "./Petition".Petition}; the real signature
       * pipeline (identity-bound records, one-signature-per-identity,
       * deadline enforcement, public counters) lives upstream of the
       * kit. See {@link PetitionMedia}.
       */
      kind: "petition";
    }
  | {
      /**
       * Structured fundraiser tile: title, pitch, money progress
       * bar, raised + goal amounts in a caller-supplied currency,
       * optional deadline, optional Donate affordance, optional
       * transparency-link row. Rendered today by
       * {@link "./Fundraiser".Fundraiser}; the real payment pipeline
       * lives upstream of the kit. See {@link FundraiserMedia}.
       */
      kind: "fundraiser";
    }
  | {
      /**
       * Structured dataset tile: name, description, row / column /
       * license / freshness metadata, downloadable file rows.
       * Rendered today by {@link "./Dataset".Dataset}; the real
       * download pipeline lives upstream of the kit. See
       * {@link DatasetMedia}.
       */
      kind: "dataset";
    }
  | {
      /**
       * Structured fact-check tile: claim, verdict badge, optional
       * summary, evidence rows. Rendered today by
       * {@link "./FactCheck".FactCheck}; the real verification
       * pipeline lives upstream of the kit. See
       * {@link FactCheckMedia}.
       */
      kind: "fact-check";
    }
  | {
      /**
       * Structured vote-record tile: bill reference, voter capacity,
       * yea / nay / abstain tallies, optional viewer vote. Rendered
       * today by {@link "./VoteRecord".VoteRecord}; the real roll-call
       * pipeline lives upstream of the kit. See
       * {@link VoteRecordMedia}.
       */
      kind: "vote-record";
    }
  | {
      /**
       * Editorial article archetype: feed row shows {@link "./Article".ArticleTeaser};
       * detail route mounts {@link "./Article".default}.
       */
      kind: "article";
    }
  | {
      /**
       * Append-only liveticker archetype: feed row shows
       * {@link "./Liveticker".LivetickerTeaser}; detail route mounts
       * {@link "./Liveticker".default}.
       */
      kind: "liveticker";
    }
  | {
      /**
       * Structured endorsement tile: capacity, target, statement.
       * See {@link "./Endorsement".Endorsement}.
       */
      kind: "endorsement";
    }
  | {
      /**
       * Structured commitment tile: capacity, text, by-date, optional
       * fulfilment. See {@link "./Commitment".Commitment}.
       */
      kind: "commitment";
    }
  | {
      /**
       * Structured disclosure tile: type, counterparty, amount, purpose.
       * See {@link "./Disclosure".Disclosure}.
       */
      kind: "disclosure";
    }
  | {
      /**
       * Decree archetype: feed row shows {@link "./Decree".DecreeTeaser};
       * detail route mounts {@link "./Decree".default}.
       */
      kind: "decree";
    }
  | {
      /**
       * Testimony archetype: feed row shows {@link "./Testimony".TestimonyTeaser};
       * detail route mounts {@link "./Testimony".default}.
       */
      kind: "testimony";
    };

/**
 * Inputs to {@link pickPostType} -- the subset of {@link PostProps} that
 * actually drives the classification. Declared as a `Pick` so any
 * structurally-compatible value (notably {@link PostProps} itself) is
 * accepted without an explicit projection at the call site.
 */
export type PostTypeInput = Pick<PostProps, "content" | "media" | "archetype">;

/**
 * Pure classifier. Maps {@link PostTypeInput} to a {@link PostType}.
 *
 * The dispatch is mechanical: when {@link PostProps.archetype} is set, its
 * discriminant wins first (`article`, `liveticker`, `decree`, `testimony`). Otherwise, when `media` is
 * set, the {@link PostMedia} discriminant decides the kind 1:1; when `media` is
 * absent, the post is `text` regardless of whether `content` is set.
 * `content`'s contents are never inspected -- empty / whitespace-only
 * commentary still classifies as `text`, and a missing `content` next to a
 * link preview still classifies as `text-url`.
 *
 * @param input - Body-driving props from a {@link PostProps}.
 * @returns The matching {@link PostType}.
 */
export function pickPostType(input: PostTypeInput): PostType {
  const { archetype, media } = input;
  if (archetype !== undefined) {
    switch (archetype.kind) {
      case "article":
        return { kind: "article" };
      case "liveticker":
        return { kind: "liveticker" };
      case "decree":
        return { kind: "decree" };
      case "testimony":
        return { kind: "testimony" };
    }
  }
  if (!media) return { kind: "text" };
  switch (media.kind) {
    case "link":
      return { kind: "text-url", url: media.preview.url };
    case "image":
      return { kind: "image" };
    case "video":
      return { kind: "video" };
    case "audio":
      return { kind: "audio" };
    case "gallery":
      return { kind: "gallery" };
    case "mosaic":
      return { kind: "mosaic" };
    case "carousel":
      return { kind: "carousel" };
    case "poll":
      return { kind: "poll" };
    case "event":
      return { kind: "event" };
    case "petition":
      return { kind: "petition" };
    case "fundraiser":
      return { kind: "fundraiser" };
    case "dataset":
      return { kind: "dataset" };
    case "fact-check":
      return { kind: "fact-check" };
    case "vote-record":
      return { kind: "vote-record" };
    case "endorsement":
      return { kind: "endorsement" };
    case "commitment":
      return { kind: "commitment" };
    case "disclosure":
      return { kind: "disclosure" };
  }
}
