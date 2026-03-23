/**
 * Pure router from {@link PostProps} body fields to a discriminated union of
 * post **type** + typed props for the matching post-TYPE component under
 * {@link "./Body/types"}. Classifies via {@link pickPostType}; composes
 * {@link TextBodyProps} and attachment props so {@link PostBodyByType} only
 * switches on `kind`.
 */
import { pickPostType, type PostType, type PostTypeInput } from "../post-type";
import type { ArticlePostProps } from "./Body/types/ArticlePost";
import type { AudioPostProps } from "./Body/types/AudioPost";
import type { CarouselPostProps } from "./Body/types/CarouselPost";
import type { CommitmentPostProps } from "./Body/types/CommitmentPost";
import type { DatasetPostProps } from "./Body/types/DatasetPost";
import type { DecreePostProps } from "./Body/types/DecreePost";
import type { DisclosurePostProps } from "./Body/types/DisclosurePost";
import type { EndorsementPostProps } from "./Body/types/EndorsementPost";
import type { EventPostProps } from "./Body/types/EventPost";
import type { FactCheckPostProps } from "./Body/types/FactCheckPost";
import type { FundraiserPostProps } from "./Body/types/FundraiserPost";
import type { GalleryPostProps } from "./Body/types/GalleryPost";
import type { ImagePostProps } from "./Body/types/ImagePost";
import type { LivetickerPostProps } from "./Body/types/LivetickerPost";
import type { MosaicPostProps } from "./Body/types/MosaicPost";
import type { PetitionPostProps } from "./Body/types/PetitionPost";
import type { PollPostProps } from "./Body/types/PollPost";
import type { TestimonyPostProps } from "./Body/types/TestimonyPost";
import type { TextPostProps } from "./Body/types/TextPost";
import type { TextUrlPostProps } from "./Body/types/TextUrlPost";
import type { VideoPostProps } from "./Body/types/VideoPost";
import type { VoteRecordPostProps } from "./Body/types/VoteRecordPost";
import type { PostBodyContentHandlers } from "./Body/slots/types";
import type { TextBodyProps } from "./Body/slots/types";
import type {
  AudioMedia,
  CarouselMedia,
  CommitmentMedia,
  DatasetMedia,
  DisclosureMedia,
  EndorsementMedia,
  EventMedia,
  FactCheckMedia,
  FundraiserMedia,
  GalleryMedia,
  ImageMedia,
  LinkMedia,
  MosaicMedia,
  PetitionMedia,
  PollMedia,
  PostArchetype,
  PostContent,
  PostMedia,
  VideoMedia,
  VoteRecordMedia,
} from "./Post";

export type PostVariantKind = PostType["kind"];

export type PostVariantInput = PostTypeInput &
  PostBodyContentHandlers & {
    onArchetypePress?: () => void;
  };

export type ResolvedPostVariant =
  | { kind: "text"; props: TextPostProps }
  | { kind: "text-url"; props: TextUrlPostProps }
  | { kind: "image"; props: ImagePostProps }
  | { kind: "video"; props: VideoPostProps }
  | { kind: "audio"; props: AudioPostProps }
  | { kind: "gallery"; props: GalleryPostProps }
  | { kind: "mosaic"; props: MosaicPostProps }
  | { kind: "carousel"; props: CarouselPostProps }
  | { kind: "poll"; props: PollPostProps }
  | { kind: "event"; props: EventPostProps }
  | { kind: "petition"; props: PetitionPostProps }
  | { kind: "fundraiser"; props: FundraiserPostProps }
  | { kind: "dataset"; props: DatasetPostProps }
  | { kind: "fact-check"; props: FactCheckPostProps }
  | { kind: "vote-record"; props: VoteRecordPostProps }
  | { kind: "endorsement"; props: EndorsementPostProps }
  | { kind: "commitment"; props: CommitmentPostProps }
  | { kind: "disclosure"; props: DisclosurePostProps }
  | { kind: "article"; props: ArticlePostProps }
  | { kind: "liveticker"; props: LivetickerPostProps }
  | { kind: "decree"; props: DecreePostProps }
  | { kind: "testimony"; props: TestimonyPostProps };

export function hasPostContent(
  content: PostContent | undefined,
): boolean {
  if (content == null) return false;
  if (typeof content === "string") return content.length > 0;
  return content.length > 0;
}

export function hasMatchingUrlSegment(
  content: PostContent | undefined,
  href: string,
): boolean {
  if (!content || typeof content === "string") return false;
  return content.some(
    (segment) => segment.kind === "url" && segment.href === href,
  );
}

function textProps(
  input: PostVariantInput,
  content: PostContent | undefined,
): TextBodyProps {
  return {
    content,
    hasContent: hasPostContent(content),
    linkColor: input.linkColor,
    onMentionPress: input.onMentionPress,
    onUrlPress: input.onUrlPress,
    onHashtagPress: input.onHashtagPress,
  };
}

function resolveArchetype(
  archetype: PostArchetype,
  onArchetypePress: (() => void) | undefined,
): ResolvedPostVariant {
  switch (archetype.kind) {
    case "article":
      return {
        kind: "article",
        props: { archetype, onArchetypePress },
      };
    case "liveticker":
      return {
        kind: "liveticker",
        props: { archetype, onArchetypePress },
      };
    case "decree":
      return {
        kind: "decree",
        props: { archetype, onArchetypePress },
      };
    case "testimony":
      return {
        kind: "testimony",
        props: { archetype, onArchetypePress },
      };
  }
}

function assertMedia<T extends PostMedia["kind"]>(
  media: PostMedia | undefined,
  kind: T,
): Extract<PostMedia, { kind: T }> {
  if (!media || media.kind !== kind) {
    throw new Error(`resolvePostVariant: expected media.kind === ${kind}`);
  }
  return media as Extract<PostMedia, { kind: T }>;
}

/**
 * @param input - Body-driving {@link PostProps} fields and press handlers.
 */
export function resolvePostVariant(
  input: PostVariantInput,
): ResolvedPostVariant {
  const { content, media, archetype, onArchetypePress } = input;
  const postType = pickPostType({ content, media, archetype });
  const kind = postType.kind;
  const text = textProps(input, content);

  if (archetype !== undefined) {
    return resolveArchetype(archetype, onArchetypePress);
  }

  switch (kind) {
    case "text":
      return { kind: "text", props: { text } };
    case "text-url": {
      const linkMedia = assertMedia(media, "link") as LinkMedia;
      return {
        kind: "text-url",
        props: {
          text,
          link: { media: linkMedia },
          showInlineUrl: !hasMatchingUrlSegment(
            content,
            linkMedia.preview.url,
          ),
          linkColor: input.linkColor,
        },
      };
    }
    case "image":
      return {
        kind: "image",
        props: {
          text,
          image: { media: assertMedia(media, "image") as ImageMedia },
        },
      };
    case "video":
      return {
        kind: "video",
        props: {
          text,
          video: { media: assertMedia(media, "video") as VideoMedia },
        },
      };
    case "audio":
      return {
        kind: "audio",
        props: {
          text,
          audio: { media: assertMedia(media, "audio") as AudioMedia },
        },
      };
    case "gallery":
      return {
        kind: "gallery",
        props: {
          text,
          gallery: { media: assertMedia(media, "gallery") as GalleryMedia },
        },
      };
    case "mosaic":
      return {
        kind: "mosaic",
        props: {
          text,
          mosaic: { media: assertMedia(media, "mosaic") as MosaicMedia },
        },
      };
    case "carousel":
      return {
        kind: "carousel",
        props: {
          text,
          carousel: {
            media: assertMedia(media, "carousel") as CarouselMedia,
          },
        },
      };
    case "poll":
      return {
        kind: "poll",
        props: {
          text,
          poll: { media: assertMedia(media, "poll") as PollMedia },
        },
      };
    case "event":
      return {
        kind: "event",
        props: {
          text,
          event: { media: assertMedia(media, "event") as EventMedia },
        },
      };
    case "petition":
      return {
        kind: "petition",
        props: {
          text,
          petition: { media: assertMedia(media, "petition") as PetitionMedia },
        },
      };
    case "fundraiser":
      return {
        kind: "fundraiser",
        props: {
          text,
          fundraiser: {
            media: assertMedia(media, "fundraiser") as FundraiserMedia,
          },
        },
      };
    case "dataset":
      return {
        kind: "dataset",
        props: {
          text,
          dataset: { media: assertMedia(media, "dataset") as DatasetMedia },
        },
      };
    case "fact-check":
      return {
        kind: "fact-check",
        props: {
          text,
          factCheck: {
            media: assertMedia(media, "fact-check") as FactCheckMedia,
          },
        },
      };
    case "vote-record":
      return {
        kind: "vote-record",
        props: {
          text,
          voteRecord: {
            media: assertMedia(media, "vote-record") as VoteRecordMedia,
          },
        },
      };
    case "endorsement":
      return {
        kind: "endorsement",
        props: {
          text,
          endorsement: {
            media: assertMedia(media, "endorsement") as EndorsementMedia,
          },
        },
      };
    case "commitment":
      return {
        kind: "commitment",
        props: {
          text,
          commitment: {
            media: assertMedia(media, "commitment") as CommitmentMedia,
          },
        },
      };
    case "disclosure":
      return {
        kind: "disclosure",
        props: {
          text,
          disclosure: {
            media: assertMedia(media, "disclosure") as DisclosureMedia,
          },
        },
      };
    case "article":
    case "liveticker":
    case "decree":
    case "testimony":
      return { kind: "text", props: { text } };
  }
}
