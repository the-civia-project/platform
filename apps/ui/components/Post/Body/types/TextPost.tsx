import { TextBody } from "../slots/TextBody";
import type { TextBodyProps } from "../slots/types";

export type TextPostProps = {
  text: TextBodyProps;
};

export function TextPost({ text }: TextPostProps) {
  return <TextBody {...text} />;
}
