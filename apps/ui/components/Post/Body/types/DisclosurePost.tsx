import { DisclosureBody, TextBody } from "../slots";
import type { DisclosureBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type DisclosurePostProps = WithTextSlot<{
  disclosure: DisclosureBodyProps;
}>;

export function DisclosurePost({ text, disclosure }: DisclosurePostProps) {
  return (
    <>
      <TextBody {...text} />
      <DisclosureBody {...disclosure} />
    </>
  );
}
