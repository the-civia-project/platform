import Event from "../../Event/Event";
import type { EventMedia } from "../../Post";

export type EventBodyProps = { media: EventMedia };

export function EventBody({ media }: EventBodyProps) {
  return <Event {...media.event} onRsvpPress={media.onRsvpPress} />;
}
