import type { PostContent } from "../../Post";

/**
 * Press handlers and link tone shared by {@link TextBody} and other
 * commentary-bearing atomic bodies.
 */
export type PostBodyContentHandlers = {
  /** Link tone for mentions, URLs, and hashtags in structured content. */
  linkColor: string;
  /** Forwarded from {@link PostProps.onMentionPress}. */
  onMentionPress?: (handle: string) => void;
  /** Forwarded from {@link PostProps.onUrlPress}. */
  onUrlPress?: (href: string) => void;
  /** Forwarded from {@link PostProps.onHashtagPress}. */
  onHashtagPress?: (tag: string) => void;
};

/**
 * Props for the atomic {@link TextBody} slot.
 */
export type TextBodyProps = PostBodyContentHandlers & {
  /** {@link PostProps.content} value. */
  content: PostContent | undefined;
  /**
   * When `false`, {@link TextBody} renders nothing. Derived from
   * {@link hasPostContent} in {@link resolvePostVariant}.
   */
  hasContent: boolean;
};
