import Poll from "../../Poll/Poll";
import type { PollMedia } from "../../Post";

export type PollBodyProps = { media: PollMedia };

export function PollBody({ media }: PollBodyProps) {
  return <Poll {...media.poll} onVotePress={media.onVotePress} />;
}
