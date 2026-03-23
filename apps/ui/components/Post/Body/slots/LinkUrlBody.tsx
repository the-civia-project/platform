/**
 * Atomic auto URL line above an OpenGraph card (`text-url` posts).
 */
import { prettifyUrl } from "../../../post-url";
import { Text } from "../../../Typography";
import { bodyStyles } from "./bodyStyles";
import type { LinkMedia } from "../../Post";

export type LinkUrlBodyProps = {
  media: LinkMedia;
  linkColor: string;
};

/** @param props - {@link LinkUrlBodyProps} */
export function LinkUrlBody({ media, linkColor }: LinkUrlBodyProps) {
  const href = media.preview.url;
  const visible = prettifyUrl(href);
  const press = media.onPress;
  return (
    <Text
      style={[bodyStyles.content, { color: linkColor }]}
      onPress={press}
      accessibilityRole={press ? "link" : undefined}
      accessibilityHint={press ? `Opens ${visible}` : undefined}
    >
      {visible}
    </Text>
  );
}
