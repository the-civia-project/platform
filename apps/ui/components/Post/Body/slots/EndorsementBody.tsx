import Endorsement from "../../Endorsement/Endorsement";
import type { EndorsementMedia } from "../../Post";

export type EndorsementBodyProps = { media: EndorsementMedia };

export function EndorsementBody({ media }: EndorsementBodyProps) {
  return <Endorsement endorsement={media.endorsement} />;
}
