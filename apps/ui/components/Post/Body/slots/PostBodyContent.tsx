/**
 * Low-level commentary renderer (plain string or structured segments).
 * {@link TextBody} is the public atomic slot; this module holds the
 * segment map implementation.
 */
import { Text as RNText } from "react-native";
import { prettifyUrl } from "../../../post-url";
import { Text } from "../../../Typography";
import { bodyStyles } from "./bodyStyles";
import type { PostBodyContentHandlers } from "./types";
import type {
  PostContent,
  PostHashtagSegment,
  PostMentionSegment,
  PostUrlSegment,
} from "../../Post";

export type PostBodyContentProps = PostBodyContentHandlers & {
  content: PostContent | undefined;
};

export function PostBodyContent({
  content,
  linkColor,
  onMentionPress,
  onUrlPress,
  onHashtagPress,
}: PostBodyContentProps) {
  if (content == null) return null;
  if (typeof content === "string") {
    return content ? <Text style={bodyStyles.content}>{content}</Text> : null;
  }
  if (content.length === 0) return null;
  return (
    <Text style={bodyStyles.content}>
      {content.map((segment, index) => {
        switch (segment.kind) {
          case "text":
            return segment.text;
          case "mention":
            return renderMentionSegment(
              segment,
              index,
              linkColor,
              onMentionPress,
            );
          case "url":
            return renderUrlSegment(segment, index, linkColor, onUrlPress);
          case "hashtag":
            return renderHashtagSegment(
              segment,
              index,
              linkColor,
              onHashtagPress,
            );
        }
      })}
    </Text>
  );
}

function renderMentionSegment(
  segment: PostMentionSegment,
  index: number,
  mentionColor: string,
  onMentionPress: ((handle: string) => void) | undefined,
) {
  const visible = `@${segment.display ?? segment.handle}`;
  const press = onMentionPress
    ? () => onMentionPress(segment.handle)
    : undefined;
  return (
    <RNText
      key={`mention-${index}-${segment.handle}`}
      style={{ color: mentionColor }}
      onPress={press}
      accessibilityRole={press ? "link" : undefined}
      accessibilityHint={
        press ? `Opens @${segment.handle}'s profile` : undefined
      }
    >
      {visible}
    </RNText>
  );
}

function renderUrlSegment(
  segment: PostUrlSegment,
  index: number,
  urlColor: string,
  onUrlPress: ((href: string) => void) | undefined,
) {
  const visible = prettifyUrl(segment.href);
  const press = onUrlPress ? () => onUrlPress(segment.href) : undefined;
  return (
    <RNText
      key={`url-${index}-${segment.href}`}
      style={{ color: urlColor }}
      onPress={press}
      accessibilityRole={press ? "link" : undefined}
      accessibilityHint={press ? `Opens ${visible}` : undefined}
    >
      {visible}
    </RNText>
  );
}

function renderHashtagSegment(
  segment: PostHashtagSegment,
  index: number,
  hashtagColor: string,
  onHashtagPress: ((tag: string) => void) | undefined,
) {
  const visible = `#${segment.tag}`;
  const press = onHashtagPress
    ? () => onHashtagPress(segment.tag)
    : undefined;
  return (
    <RNText
      key={`hashtag-${index}-${segment.tag}`}
      style={{ color: hashtagColor }}
      onPress={press}
      accessibilityRole={press ? "link" : undefined}
      accessibilityHint={press ? `Opens the #${segment.tag} feed` : undefined}
    >
      {visible}
    </RNText>
  );
}
