import { TextBody, VoteRecordBody } from "../slots";
import type { VoteRecordBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type VoteRecordPostProps = WithTextSlot<{
  voteRecord: VoteRecordBodyProps;
}>;

export function VoteRecordPost({ text, voteRecord }: VoteRecordPostProps) {
  return (
    <>
      <TextBody {...text} />
      <VoteRecordBody {...voteRecord} />
    </>
  );
}
