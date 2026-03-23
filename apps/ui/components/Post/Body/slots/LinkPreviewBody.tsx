/**
 * Atomic OpenGraph link-preview card (`text-url` posts).
 */
import { LinkPreview as LinkPreviewCard } from "../../../Media";
import type { LinkMedia } from "../../Post";

export type LinkPreviewBodyProps = {
  media: LinkMedia;
};

/** @param props - {@link LinkPreviewBodyProps} */
export function LinkPreviewBody({ media }: LinkPreviewBodyProps) {
  return (
    <LinkPreviewCard preview={media.preview} onPress={media.onPress} />
  );
}
