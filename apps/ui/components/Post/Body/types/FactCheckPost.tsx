import { FactCheckBody, TextBody } from "../slots";
import type { FactCheckBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type FactCheckPostProps = WithTextSlot<{
  factCheck: FactCheckBodyProps;
}>;

export function FactCheckPost({ text, factCheck }: FactCheckPostProps) {
  return (
    <>
      <TextBody {...text} />
      <FactCheckBody {...factCheck} />
    </>
  );
}
