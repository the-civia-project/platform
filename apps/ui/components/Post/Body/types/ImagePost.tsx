import { ImageBody, TextBody } from "../slots";
import type { ImageBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type ImagePostProps = WithTextSlot<{ image: ImageBodyProps }>;

export function ImagePost({ text, image }: ImagePostProps) {
  return (
    <>
      <TextBody {...text} />
      <ImageBody {...image} />
    </>
  );
}
