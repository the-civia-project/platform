import { EndorsementBody, TextBody } from "../slots";
import type { EndorsementBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type EndorsementPostProps = WithTextSlot<{
  endorsement: EndorsementBodyProps;
}>;

export function EndorsementPost({ text, endorsement }: EndorsementPostProps) {
  return (
    <>
      <TextBody {...text} />
      <EndorsementBody {...endorsement} />
    </>
  );
}
