import { Audio } from "../../../Media";
import type { AudioMedia } from "../../Post";

export type AudioBodyProps = {
  media: AudioMedia;
};

/** @param props - {@link AudioBodyProps} */
export function AudioBody({ media }: AudioBodyProps) {
  return <Audio {...media.audio} onPress={media.onPress} />;
}
