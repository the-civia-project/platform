import type { TextBodyProps } from "../slots/types";

/** Standard post-TYPE props: optional commentary + one attachment slot. */
export type WithTextSlot<TAttachment> = {
  text: TextBodyProps;
} & TAttachment;
