import { DatasetBody, TextBody } from "../slots";
import type { DatasetBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type DatasetPostProps = WithTextSlot<{ dataset: DatasetBodyProps }>;

export function DatasetPost({ text, dataset }: DatasetPostProps) {
  return (
    <>
      <TextBody {...text} />
      <DatasetBody {...dataset} />
    </>
  );
}
