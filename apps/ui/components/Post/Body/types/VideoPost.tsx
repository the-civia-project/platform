import { TextBody, VideoBody } from "../slots";
import type { VideoBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type VideoPostProps = WithTextSlot<{ video: VideoBodyProps }>;

export function VideoPost({ text, video }: VideoPostProps) {
  return (
    <>
      <TextBody {...text} />
      <VideoBody {...video} />
    </>
  );
}
