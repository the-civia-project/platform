import { ArticleTeaser } from "../../Article/ArticleTeaser";
import type { PostArchetype } from "../../Post";

export type ArticleBodyProps = {
  archetype: Extract<PostArchetype, { kind: "article" }>;
  onArchetypePress?: () => void;
};

export function ArticleBody({ archetype, onArchetypePress }: ArticleBodyProps) {
  return (
    <ArticleTeaser article={archetype.article} onPress={onArchetypePress} />
  );
}
