import { AudioBody, TextBody } from "../slots";
import type { AudioBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type AudioPostProps = WithTextSlot<{ audio: AudioBodyProps }>;

export function AudioPost({ text, audio }: AudioPostProps) {
  return (
    <>
      <TextBody {...text} />
      <AudioBody {...audio} />
    </>
  );
}
