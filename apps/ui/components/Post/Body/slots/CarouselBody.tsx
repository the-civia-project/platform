import { Carousel } from "../../../Media";
import type { CarouselMedia } from "../../Post";

export type CarouselBodyProps = {
  media: CarouselMedia;
};

/** @param props - {@link CarouselBodyProps} */
export function CarouselBody({ media }: CarouselBodyProps) {
  return (
    <Carousel
      images={media.images}
      aspectRatio={media.aspectRatio}
      onImagePress={media.onImagePress}
    />
  );
}
