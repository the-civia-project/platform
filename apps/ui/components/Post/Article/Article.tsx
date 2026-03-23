/**
 * Full-view editorial article silhouette for dedicated routes. Renders a
 * cover image, headline stack (title, dek, byline, dateline), optional
 * paywall badge, and body paragraphs -- the kit paints the reading shape;
 * CMS ingestion, paywall enforcement, and analytics live upstream. Pair
 * with {@link ArticleTeaser} on {@link "../Post".PostProps.archetype} for
 * the feed-row teaser of the same {@link PostArticle} payload.
 */
import { FileText, Lock } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { Image } from "../../Media";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * Cover image for {@link PostArticle}. Reuses the kit's {@link "../../Media".ImageData}
 * contract (remote `source`, required `alt`, optional `aspectRatio`).
 */
export type PostArticleCover = {
  /** Remote image URL for the hero / cover frame. */
  source: string;
  /**
   * Screen-reader description of the cover art.
   */
  alt: string;
  /**
   * Display aspect ratio (width / height) for the hero band.
   * @defaultValue 16/9
   */
  aspectRatio?: number;
};

/**
 * Payload shared by {@link Article} and {@link ArticleTeaser}. Carries the
 * byline / dek / dateline / cover / reading-time metadata the teaser needs,
 * plus {@link PostArticle.body} paragraphs for the long-form view only.
 */
export type PostArticle = {
  /** Headline displayed in both teaser and full view. */
  title: string;
  /**
   * One-line subtitle (dek) under the title. Rendered in muted body copy
   * in both surfaces.
   */
  dek: string;
  /**
   * Attribution line (e.g. "By Mila Olteanu · City desk"). The kit does not
   * parse roles; pass the string your CMS already formatted.
   */
  byline: string;
  /**
   * Publication dateline (e.g. "Published 12 June 2026"). Read-only copy.
   */
  dateline: string;
  /** Cover art shown above the title stack. */
  cover: PostArticleCover;
  /**
   * Human-readable reading estimate ("8 min read"). The kit does not derive
   * this from word count; product code owns the calculation.
   */
  readingTimeLabel: string;
  /**
   * When `true`, a compact "Subscriber" badge renders next to the meta row
   * in both teaser and full view. Paywall logic is upstream.
   * @defaultValue false
   */
  paywalled?: boolean;
  /**
   * Body paragraphs for the full view. Omitted or empty yields a short
   * placeholder line in {@link Article} only; {@link ArticleTeaser} ignores
   * body copy entirely.
   */
  body?: readonly string[];
};

/**
 * Props for {@link Article}.
 */
export type ArticleProps = {
  /** Article payload -- title through body. */
  article: PostArticle;
};

/**
 * Scrollable long-form article layout for a detail route.
 *
 * @param props - {@link ArticleProps}
 */
export default function Article({ article }: ArticleProps) {
  const theme = useTheme();
  const paragraphs =
    article.body !== undefined && article.body.length > 0
      ? article.body
      : [
          "This is placeholder body copy for the kit silhouette. Wire your CMS paragraphs into PostArticle.body.",
        ];

  return (
    <View style={styles.root}>
      <Image
        source={article.cover.source}
        alt={article.cover.alt}
        aspectRatio={article.cover.aspectRatio ?? 16 / 9}
      />
      <View style={styles.copyBlock}>
        <View style={styles.kindRow}>
          <FileText size={16} color={theme.fgMuted} />
          <RNText style={[styles.kindLabel, { color: theme.fgMuted }]}>
            Article
          </RNText>
        </View>
        <Text style={[styles.title, { color: theme.fgEmphasis }]}>
          {article.title}
        </Text>
        <RNText style={[styles.dek, { color: theme.fgMuted }]}>{article.dek}</RNText>
        <RNText style={[styles.byline, { color: theme.fg }]}>{article.byline}</RNText>
        <View style={styles.metaRow}>
          <RNText style={[styles.meta, { color: theme.fgMuted }]}>
            {article.dateline} · {article.readingTimeLabel}
          </RNText>
          {article.paywalled === true ? (
            <View
              style={[
                styles.paywallBadge,
                {
                  borderColor: theme.borderDefault,
                  backgroundColor: theme.surfaceWell,
                },
              ]}
            >
              <Lock size={12} color={theme.fgMuted} />
              <RNText style={[styles.paywallLabel, { color: theme.fgMuted }]}>
                Subscriber
              </RNText>
            </View>
          ) : null}
        </View>
        {paragraphs.map((p, i) => (
          <RNText
            key={i}
            style={[styles.paragraph, { color: theme.fg }]}
          >
            {p}
          </RNText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
  },
  copyBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kindLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  dek: {
    fontSize: 16,
    lineHeight: 22,
  },
  byline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  paywallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  paywallLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 8,
  },
});
