/**
 * Barrel for the kit's `Event` family. Default-exported principal
 * (matches {@link "../Poll".default}) because the family ships one
 * principal component plus the data shapes consumers reach for when
 * they store event attachments.
 */
export {
  default,
  Event,
  type PostEvent,
  type PostEventFormat,
  type EventProps,
} from "./Event";
