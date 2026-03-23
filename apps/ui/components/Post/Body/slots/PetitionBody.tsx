import Petition from "../../Petition/Petition";
import type { PetitionMedia } from "../../Post";

export type PetitionBodyProps = { media: PetitionMedia };

export function PetitionBody({ media }: PetitionBodyProps) {
  return <Petition {...media.petition} onSignPress={media.onSignPress} />;
}
