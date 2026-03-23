import { PetitionBody, TextBody } from "../slots";
import type { PetitionBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type PetitionPostProps = WithTextSlot<{ petition: PetitionBodyProps }>;

export function PetitionPost({ text, petition }: PetitionPostProps) {
  return (
    <>
      <TextBody {...text} />
      <PetitionBody {...petition} />
    </>
  );
}
