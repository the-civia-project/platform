/**
 * Feed-row teaser for an {@link "../Post".PostArchetype} `article` variant.
 * Renders a hairline-bordered card with the "Article" kind row, headline
 * stack, dateline + reading time + optional paywall badge, and a 16:9
 * cover thumbnail -- the same {@link PostArticle} metadata {@link Article}
 * uses up top, without the long body. Wire {@link ArticleTeaserProps.onPress}
 * from {@link "../Post".PostProps.onArchetypePress} to navigate to the full
 * article route.
 */
import { FileText, Lock } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Image } from "../../Media";
import { KindHeader } from "../../KindHeader";
import { MetaLine } from "../../MetaLine";
import { StatusBadge } from "../../StatusBadge";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";
import type { PostArticle } from "./Article";

/**
 * Props for {@link ArticleTeaser}.
 */
export type ArticleTeaserProps = {
  /** Shared payload with {@link "./Article".Article}; body is ignored here. */
  article: PostArticle;
  /**
   * When set, the teaser wraps in a {@link Pressable} with the kit's
   * standard opacity feedback. Omit for a static row.
   */
  onPress?: () => void;
};

/**
 * Archetype teaser card for the article shape inside {@link "../Post".default}.
 *
 * @param props - {@link ArticleTeaserProps}
 */
export function ArticleTeaser({ article, onPress }: ArticleTeaserProps) {
  const theme = useTheme();

  return (
    <StructuredTile
      variant="teaser"
      onPress={onPress}
      accessibilityHint="Opens the full article"
    >
      <KindHeader icon={FileText} label="Article" size="md" />
      <Text style={[styles.title, { color: theme.fgEmphasis }]}>
        {article.title}
      </Text>
      <RNText style={[styles.dek, { color: theme.fgMuted }]} numberOfLines={3}>
        {article.dek}
      </RNText>
      <View style={styles.metaRow}>
        <MetaLine
          segments={[article.dateline, article.readingTimeLabel]}
          tone="footer"
        />
        {article.paywalled === true ? (
          <StatusBadge label="Subscriber" icon={Lock} />
        ) : null}
      </View>
      <Image
        source={article.cover.source}
        alt={article.cover.alt}
        aspectRatio={16 / 9}
      />
    </StructuredTile>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  dek: {
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
});
