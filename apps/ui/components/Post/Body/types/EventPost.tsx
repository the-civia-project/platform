import { EventBody, TextBody } from "../slots";
import type { EventBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type EventPostProps = WithTextSlot<{ event: EventBodyProps }>;

export function EventPost({ text, event }: EventPostProps) {
  return (
    <>
      <TextBody {...text} />
      <EventBody {...event} />
    </>
  );
}
