import { LivetickerBody } from "../slots";
import type { LivetickerBodyProps } from "../slots";

export type LivetickerPostProps = LivetickerBodyProps;

export function LivetickerPost(props: LivetickerPostProps) {
  return <LivetickerBody {...props} />;
}
