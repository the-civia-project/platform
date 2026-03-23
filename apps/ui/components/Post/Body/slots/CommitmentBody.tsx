import Commitment from "../../Commitment/Commitment";
import type { CommitmentMedia } from "../../Post";

export type CommitmentBodyProps = { media: CommitmentMedia };

export function CommitmentBody({ media }: CommitmentBodyProps) {
  return <Commitment commitment={media.commitment} />;
}
