/**
 * Post-type router: mounts exactly one post-TYPE component from
 * {@link "./types"} based on {@link resolvePostVariant}.
 */
import type { ResolvedPostVariant } from "../resolve-post-variant";
import {
  ArticlePost,
  AudioPost,
  CarouselPost,
  CommitmentPost,
  DatasetPost,
  DecreePost,
  DisclosurePost,
  EndorsementPost,
  EventPost,
  FactCheckPost,
  FundraiserPost,
  GalleryPost,
  ImagePost,
  LivetickerPost,
  MosaicPost,
  PetitionPost,
  PollPost,
  TestimonyPost,
  TextPost,
  TextUrlPost,
  VideoPost,
  VoteRecordPost,
} from "./types/index";

export type PostBodyByTypeProps = {
  resolved: ResolvedPostVariant;
};

/**
 * @param props - {@link PostBodyByTypeProps}
 */
export function PostBodyByType({ resolved }: PostBodyByTypeProps) {
  switch (resolved.kind) {
    case "text":
      return <TextPost {...resolved.props} />;
    case "text-url":
      return <TextUrlPost {...resolved.props} />;
    case "image":
      return <ImagePost {...resolved.props} />;
    case "video":
      return <VideoPost {...resolved.props} />;
    case "audio":
      return <AudioPost {...resolved.props} />;
    case "gallery":
      return <GalleryPost {...resolved.props} />;
    case "mosaic":
      return <MosaicPost {...resolved.props} />;
    case "carousel":
      return <CarouselPost {...resolved.props} />;
    case "poll":
      return <PollPost {...resolved.props} />;
    case "event":
      return <EventPost {...resolved.props} />;
    case "petition":
      return <PetitionPost {...resolved.props} />;
    case "fundraiser":
      return <FundraiserPost {...resolved.props} />;
    case "dataset":
      return <DatasetPost {...resolved.props} />;
    case "fact-check":
      return <FactCheckPost {...resolved.props} />;
    case "vote-record":
      return <VoteRecordPost {...resolved.props} />;
    case "endorsement":
      return <EndorsementPost {...resolved.props} />;
    case "commitment":
      return <CommitmentPost {...resolved.props} />;
    case "disclosure":
      return <DisclosurePost {...resolved.props} />;
    case "article":
      return <ArticlePost {...resolved.props} />;
    case "liveticker":
      return <LivetickerPost {...resolved.props} />;
    case "decree":
      return <DecreePost {...resolved.props} />;
    case "testimony":
      return <TestimonyPost {...resolved.props} />;
  }
}
