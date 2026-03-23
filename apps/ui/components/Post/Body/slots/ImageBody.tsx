import { Image } from "../../../Media";
import type { ImageMedia } from "../../Post";

export type ImageBodyProps = {
  media: ImageMedia;
};

/** @param props - {@link ImageBodyProps} */
export function ImageBody({ media }: ImageBodyProps) {
  return <Image {...media.image} onPress={media.onPress} />;
}
