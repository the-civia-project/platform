import { GalleryBody, TextBody } from "../slots";
import type { GalleryBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type GalleryPostProps = WithTextSlot<{ gallery: GalleryBodyProps }>;

export function GalleryPost({ text, gallery }: GalleryPostProps) {
  return (
    <>
      <TextBody {...text} />
      <GalleryBody {...gallery} />
    </>
  );
}
