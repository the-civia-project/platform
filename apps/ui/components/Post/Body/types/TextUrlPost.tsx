import {
  LinkPreviewBody,
  LinkUrlBody,
  TextBody,
} from "../slots";
import type { LinkPreviewBodyProps, LinkUrlBodyProps } from "../slots";
import type { TextBodyProps } from "../slots/types";

export type TextUrlPostProps = {
  text: TextBodyProps;
  link: LinkPreviewBodyProps;
  showInlineUrl: boolean;
  linkColor: string;
};

export function TextUrlPost({
  text,
  link,
  showInlineUrl,
  linkColor,
}: TextUrlPostProps) {
  const linkUrl: LinkUrlBodyProps = { media: link.media, linkColor };
  return (
    <>
      <TextBody {...text} />
      {showInlineUrl ? <LinkUrlBody {...linkUrl} /> : null}
      <LinkPreviewBody {...link} />
    </>
  );
}
