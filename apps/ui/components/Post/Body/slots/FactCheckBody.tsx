import FactCheck from "../../FactCheck/FactCheck";
import type { FactCheckMedia } from "../../Post";

export type FactCheckBodyProps = { media: FactCheckMedia };

export function FactCheckBody({ media }: FactCheckBodyProps) {
  return (
    <FactCheck
      {...media.factCheck}
      verdictLabels={media.verdictLabels}
      onEvidencePress={media.onEvidencePress}
    />
  );
}
