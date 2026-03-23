import Disclosure from "../../Disclosure/Disclosure";
import type { DisclosureMedia } from "../../Post";

export type DisclosureBodyProps = { media: DisclosureMedia };

export function DisclosureBody({ media }: DisclosureBodyProps) {
  return <Disclosure disclosure={media.disclosure} />;
}
