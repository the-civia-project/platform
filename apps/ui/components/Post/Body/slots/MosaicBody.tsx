import { Mosaic } from "../../../Media";
import type { MosaicMedia } from "../../Post";

export type MosaicBodyProps = {
  media: MosaicMedia;
};

/** @param props - {@link MosaicBodyProps} */
export function MosaicBody({ media }: MosaicBodyProps) {
  return (
    <Mosaic images={media.images} onImagePress={media.onImagePress} />
  );
}
