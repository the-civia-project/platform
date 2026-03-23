import VoteRecord from "../../VoteRecord/VoteRecord";
import type { VoteRecordMedia } from "../../Post";

export type VoteRecordBodyProps = { media: VoteRecordMedia };

export function VoteRecordBody({ media }: VoteRecordBodyProps) {
  return (
    <VoteRecord
      {...media.voteRecord}
      onVotePress={media.onVotePress}
    />
  );
}
