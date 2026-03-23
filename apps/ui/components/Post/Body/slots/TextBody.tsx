/**
 * Atomic commentary body slot. Composed by post-TYPE components when the
 * post may carry optional caption copy ({@link ImagePost}, {@link PollPost}, …).
 */
import { PostBodyContent } from "./PostBodyContent";
import type { TextBodyProps } from "./types";

/** @param props - {@link TextBodyProps} */
export function TextBody({
  hasContent,
  content,
  linkColor,
  onMentionPress,
  onUrlPress,
  onHashtagPress,
}: TextBodyProps) {
  if (!hasContent) return null;
  return (
    <PostBodyContent
      content={content}
      linkColor={linkColor}
      onMentionPress={onMentionPress}
      onUrlPress={onUrlPress}
      onHashtagPress={onHashtagPress}
    />
  );
}
