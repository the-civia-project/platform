import { CommitmentBody, TextBody } from "../slots";
import type { CommitmentBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type CommitmentPostProps = WithTextSlot<{
  commitment: CommitmentBodyProps;
}>;

export function CommitmentPost({ text, commitment }: CommitmentPostProps) {
  return (
    <>
      <TextBody {...text} />
      <CommitmentBody {...commitment} />
    </>
  );
}
