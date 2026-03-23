import { PollBody, TextBody } from "../slots";
import type { PollBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type PollPostProps = WithTextSlot<{ poll: PollBodyProps }>;

export function PollPost({ text, poll }: PollPostProps) {
  return (
    <>
      <TextBody {...text} />
      <PollBody {...poll} />
    </>
  );
}
