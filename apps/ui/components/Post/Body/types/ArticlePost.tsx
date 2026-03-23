import { ArticleBody } from "../slots";
import type { ArticleBodyProps } from "../slots";

export type ArticlePostProps = ArticleBodyProps;

export function ArticlePost(props: ArticlePostProps) {
  return <ArticleBody {...props} />;
}
