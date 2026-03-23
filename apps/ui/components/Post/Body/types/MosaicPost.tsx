import { MosaicBody, TextBody } from "../slots";
import type { MosaicBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type MosaicPostProps = WithTextSlot<{ mosaic: MosaicBodyProps }>;

export function MosaicPost({ text, mosaic }: MosaicPostProps) {
  return (
    <>
      <TextBody {...text} />
      <MosaicBody {...mosaic} />
    </>
  );
}
