import { DecreeBody } from "../slots";
import type { DecreeBodyProps } from "../slots";

export type DecreePostProps = DecreeBodyProps;

export function DecreePost(props: DecreePostProps) {
  return <DecreeBody {...props} />;
}
