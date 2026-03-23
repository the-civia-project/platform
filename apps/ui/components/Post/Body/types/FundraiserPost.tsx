import { FundraiserBody, TextBody } from "../slots";
import type { FundraiserBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type FundraiserPostProps = WithTextSlot<{
  fundraiser: FundraiserBodyProps;
}>;

export function FundraiserPost({ text, fundraiser }: FundraiserPostProps) {
  return (
    <>
      <TextBody {...text} />
      <FundraiserBody {...fundraiser} />
    </>
  );
}
