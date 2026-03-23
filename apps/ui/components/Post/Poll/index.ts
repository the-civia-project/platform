/**
 * Barrel for the kit's `Poll` family. Default-exported principal
 * (matches {@link "../Post".default} / {@link "../Profile".default})
 * because the family ships one principal component plus the data
 * shapes consumers reach for when they store poll attachments.
 *
 * The kit exports the structured-payload types ({@link PostPoll},
 * {@link PostPollOption}) alongside the component so callers can type
 * their drafts / feed rows against the same shape the renderer
 * consumes, with no parallel definition.
 */
export {
  default,
  Poll,
  type PostPoll,
  type PostPollOption,
  type PollProps,
} from "./Poll";
