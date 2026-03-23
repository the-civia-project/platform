import { Video } from "../../../Media";
import type { VideoMedia } from "../../Post";

export type VideoBodyProps = {
  media: VideoMedia;
};

/** @param props - {@link VideoBodyProps} */
export function VideoBody({ media }: VideoBodyProps) {
  return <Video {...media.video} onPress={media.onPress} />;
}
